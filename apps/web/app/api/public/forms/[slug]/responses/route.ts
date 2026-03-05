import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@submitin/database";
import { checkRateLimit, getClientIP } from "@/lib/security";
import { createFormResponse, mapValuesByLabelToFieldIds } from "@/lib/form-response";
import { verifyCaptchaToken } from "@/lib/turnstile";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Resposta ao preflight CORS (navegador envia OPTIONS antes do POST em cross-origin). */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/public/forms/[slug]/responses
 *
 * Endpoint público para receber respostas de formulários externos (ex.: Framer).
 * Use o slug do formulário na URL (ex.: /api/public/forms/contato/responses).
 *
 * Body (JSON): { "values": { "Nome do campo": "valor", "Email": "a@b.com", ... } }
 * Os nomes das chaves devem coincidir com os labels dos campos no Submitin
 * (comparação sem distinção de maiúsculas e com trim de espaços).
 *
 * Se o formulário tiver CAPTCHA ativo, inclua "captchaToken" no body.
 * Para formulários usados apenas pelo Framer, desative o CAPTCHA nas configurações.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const clientIP = getClientIP(request);
    const rateLimitKey = `submit-slug:${slug}:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      );
    }

    const form = await prisma.form.findFirst({
      where: {
        slug,
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
      return NextResponse.json(
        { error: "Formulário não encontrado ou não publicado." },
        { status: 404, headers: corsHeaders }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição deve ser JSON." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Aceita { values: { ... } } OU payload flat do Framer: { buffet_name: "...", client_name: "...", ... }
    let rawValues: Record<string, string>;
    if (body.values && typeof body.values === "object" && !Array.isArray(body.values)) {
      rawValues = {};
      for (const [k, v] of Object.entries(body.values)) {
        if (v !== undefined && v !== null) rawValues[k] = String(v);
      }
    } else {
      rawValues = {};
      for (const [key, value] of Object.entries(body)) {
        if (key === "captchaToken") continue;
        if (value !== undefined && value !== null) rawValues[key] = String(value);
      }
    }

    if (Object.keys(rawValues).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado de formulário enviado." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      form.settings?.captchaEnabled &&
      form.settings?.captchaSecretKey &&
      form.settings?.captchaProvider
    ) {
      const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : undefined;
      if (!captchaToken) {
        return NextResponse.json(
          { error: "Verificação anti-spam necessária. Inclua captchaToken no body." },
          { status: 400, headers: corsHeaders }
        );
      }
      const captchaResult = await verifyCaptchaToken(
        captchaToken,
        form.settings.captchaSecretKey,
        form.settings.captchaProvider as "turnstile" | "hcaptcha"
      );
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: "Verificação anti-spam falhou." },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const valuesByFieldId = mapValuesByLabelToFieldIds(form.fields, rawValues);

    try {
      const response = await createFormResponse(form, valuesByFieldId);
      return NextResponse.json(
        { success: true, id: response.id },
        { status: 201, headers: corsHeaders }
      );
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as { status: number }).status
          : 500;
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Erro ao enviar resposta.";
      return NextResponse.json({ error: message }, { status, headers: corsHeaders });
    }
  } catch (error) {
    console.error("[public/forms/responses] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar resposta." },
      { status: 500, headers: corsHeaders }
    );
  }
}
