import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, Prisma } from "@submitin/database";
import { formSettingsSchema } from "@/lib/validations";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      include: {
        settings: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(form.settings);
  } catch (error) {
    console.error("❌ Error fetching settings:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar usuário e formulário
    const [user, form] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true }
      }),
      prisma.form.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      })
    ]);

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const isPro = user?.plan === "pro";
    const body = await request.json();
    
    console.log("📝 Salvando configurações do formulário:", form.name);
    console.log("  → Usuário PRO:", isPro);
    console.log("  → Dados recebidos:", JSON.stringify(body, null, 2));

    const validatedData = formSettingsSchema.parse(body);

    const allowMultipleResponses = validatedData.allowMultipleResponses ?? false;

    // Bloquear funcionalidades PRO para usuários Free
    const settingsData = {
      notifyEmail: validatedData.notifyEmail || null,
      notifyEmails: validatedData.notifyEmails || [],
      webhookUrl: validatedData.webhookUrl || null,
      allowMultipleResponses,
      captchaEnabled: isPro ? (validatedData.captchaEnabled || false) : false,
      captchaProvider: isPro ? (validatedData.captchaProvider || null) : null,
      captchaSiteKey: isPro ? (validatedData.captchaSiteKey || null) : null,
      captchaSecretKey: isPro ? (validatedData.captchaSecretKey || null) : null,
      hideBranding: isPro ? (validatedData.hideBranding || false) : false,
      customTheme: isPro && validatedData.customTheme ? validatedData.customTheme : Prisma.DbNull,
    };

    console.log("  → Dados a salvar (filtrados por plano):", JSON.stringify(settingsData, null, 2));

    const settings = await prisma.formSettings.upsert({
      where: { formId: id },
      update: settingsData,
      create: {
        formId: id,
        ...settingsData,
      } as Prisma.FormSettingsUncheckedCreateInput,
    });

    console.log("✅ Configurações salvas com sucesso");

    const responseSettings = { ...settings };

    if (!isPro) {
      const proFeaturesRequested =
        validatedData.captchaEnabled ||
        validatedData.hideBranding ||
        validatedData.customTheme;

      if (proFeaturesRequested) {
        console.log("⚠️ Funcionalidades PRO ignoradas (usuário Free)");
        return NextResponse.json({
          ...responseSettings,
          _warning: "Algumas funcionalidades PRO foram ignoradas. Faça upgrade para o plano PRO."
        });
      }
    }

    return NextResponse.json(responseSettings);
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erro ao atualizar configurações";
    const isPrisma = error && typeof error === "object" && "code" in error;
    if (isPrisma && error && typeof error === "object") {
      console.error("  → Prisma code:", (error as { code?: string }).code);
      console.error("  → Prisma meta:", (error as { meta?: unknown }).meta);
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
