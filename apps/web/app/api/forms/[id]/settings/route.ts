import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, Prisma } from "@submitin/database";
import { formSettingsSchema } from "@/lib/validations";
import { isPaid, isPremium } from "@/lib/stripe";

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

    // Plus libera features básicas (branding/tema); Premium libera as avançadas
    // (agendamento, parciais, CAPTCHA).
    const paid = isPaid(user?.plan);
    const premium = isPremium(user?.plan);
    const body = await request.json();

    console.log("📝 Salvando configurações do formulário:", form.name);
    console.log("  → Plano pago:", paid, "| Premium:", premium);
    console.log("  → Dados recebidos:", JSON.stringify(body, null, 2));

    const validatedData = formSettingsSchema.parse(body);

    const allowMultipleResponses = validatedData.allowMultipleResponses ?? false;

    // Bloquear funcionalidades PRO para usuários Free
    const settingsData = {
      notifyEmail: validatedData.notifyEmail || null,
      notifyEmails: validatedData.notifyEmails || [],
      webhookUrl: validatedData.webhookUrl || null,
      allowMultipleResponses,
      conversational: validatedData.conversational ?? false,
      thankYouTitle: validatedData.thankYouTitle || null,
      thankYouMessage: validatedData.thankYouMessage || null,
      thankYouRedirectUrl: validatedData.thankYouRedirectUrl || null,
      confirmationEmail: validatedData.confirmationEmail ?? false,
      // Premium: Agendamento e limites (features avançadas)
      opensAt: premium && validatedData.opensAt ? new Date(validatedData.opensAt) : null,
      closesAt: premium && validatedData.closesAt ? new Date(validatedData.closesAt) : null,
      maxResponses: premium ? validatedData.maxResponses ?? null : null,
      closedMessage: premium ? validatedData.closedMessage || null : null,
      // Premium: Respostas parciais
      capturePartials: premium ? (validatedData.capturePartials || false) : false,
      // Premium: Anti-spam / CAPTCHA
      captchaEnabled: premium ? (validatedData.captchaEnabled || false) : false,
      captchaProvider: premium ? (validatedData.captchaProvider || null) : null,
      captchaSiteKey: premium ? (validatedData.captchaSiteKey || null) : null,
      captchaSecretKey: premium ? (validatedData.captchaSecretKey || null) : null,
      // Plus + Premium: branding e tema
      hideBranding: paid ? (validatedData.hideBranding || false) : false,
      customTheme: paid && validatedData.customTheme ? validatedData.customTheme : Prisma.DbNull,
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

    // Avisa quando o plano atual não cobre alguma feature solicitada.
    const requestedPaidFeature = validatedData.hideBranding || validatedData.customTheme;
    const requestedPremiumFeature =
      validatedData.captchaEnabled ||
      validatedData.capturePartials ||
      validatedData.opensAt ||
      validatedData.closesAt ||
      validatedData.maxResponses != null;

    if ((!paid && requestedPaidFeature) || (!premium && requestedPremiumFeature)) {
      console.log("⚠️ Funcionalidades de plano superior ignoradas");
      return NextResponse.json({
        ...responseSettings,
        _warning: "Algumas funcionalidades não estão disponíveis no seu plano e foram ignoradas. Faça upgrade para liberá-las.",
      });
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
