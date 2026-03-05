import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@submitin/database";
import {
  sanitizeFormValues,
  checkRateLimit,
  getClientIP,
} from "@/lib/security";
import { createFormResponse } from "@/lib/form-response";
import { verifyCaptchaToken } from "@/lib/turnstile";

// GET - Fetch responses (protected)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const responses = await prisma.response.findMany({
      where: { formId: id },
      include: {
        fieldValues: {
          include: {
            field: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json({ error: "Erro ao buscar respostas" }, { status: 500 });
  }
}

// POST - Submit response (public)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Rate limiting - 10 submissões por minuto por IP
    const clientIP = getClientIP(request);
    const rateLimitKey = `submit:${id}:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      );
    }

    const form = await prisma.form.findFirst({
      where: {
        id,
        published: true,
      },
      include: {
        fields: true,
        settings: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const body = await request.json();

    // Verificar CAPTCHA se habilitado
    if (
      form.settings?.captchaEnabled &&
      form.settings?.captchaSecretKey &&
      form.settings?.captchaProvider
    ) {
      const captchaToken = body?.captchaToken as string | undefined;

      if (!captchaToken) {
        console.log("🔒 CAPTCHA habilitado mas token não fornecido");
        return NextResponse.json(
          { error: "Verificação anti-spam necessária. Por favor, complete o CAPTCHA." },
          { status: 400 }
        );
      }

      console.log("🔒 Verificando CAPTCHA...");
      console.log("  → Provider:", form.settings.captchaProvider);

      const captchaResult = await verifyCaptchaToken(
        captchaToken,
        form.settings.captchaSecretKey,
        form.settings.captchaProvider as "turnstile" | "hcaptcha"
      );

      if (!captchaResult.success) {
        console.error("❌ Verificação de CAPTCHA falhou:", captchaResult.errorCodes);
        return NextResponse.json(
          { error: "Verificação anti-spam falhou. Por favor, tente novamente." },
          { status: 400 }
        );
      }

      console.log("✅ CAPTCHA verificado com sucesso");
    }

    const rawValues = body?.values as Record<string, string> | undefined;

    if (!rawValues || typeof rawValues !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const values = sanitizeFormValues(rawValues);

    try {
      const response = await createFormResponse(form, values);
      return NextResponse.json({ success: true, id: response.id }, { status: 201 });
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as { status: number }).status
          : 500;
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Erro ao enviar resposta.";
      return NextResponse.json({ error: message }, { status });
    }
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json({ error: "Erro ao enviar resposta" }, { status: 500 });
  }
}
