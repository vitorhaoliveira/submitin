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

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    console.log("📝 Salvando configurações do formulário:", form.name);
    console.log("  → Dados recebidos:", JSON.stringify(body, null, 2));

    const validatedData = formSettingsSchema.parse(body);
    console.log("  → Dados validados:", JSON.stringify(validatedData, null, 2));

    const settings = await prisma.formSettings.upsert({
      where: { formId: id },
      update: {
        // Notificações
        notifyEmail: validatedData.notifyEmail || null,
        notifyEmails: validatedData.notifyEmails || [],
        webhookUrl: validatedData.webhookUrl || null,

        // PRO: Anti-spam / CAPTCHA
        captchaEnabled: validatedData.captchaEnabled || false,
        captchaProvider: validatedData.captchaProvider || null,
        captchaSiteKey: validatedData.captchaSiteKey || null,
        captchaSecretKey: validatedData.captchaSecretKey || null,

        // PRO: Branding
        hideBranding: validatedData.hideBranding || false,

        // PRO: Custom Theme
        customTheme: validatedData.customTheme ? validatedData.customTheme : Prisma.JsonNull,
      },
      create: {
        formId: id,
        // Notificações
        notifyEmail: validatedData.notifyEmail || null,
        notifyEmails: validatedData.notifyEmails || [],
        webhookUrl: validatedData.webhookUrl || null,

        // PRO: Anti-spam / CAPTCHA
        captchaEnabled: validatedData.captchaEnabled || false,
        captchaProvider: validatedData.captchaProvider || null,
        captchaSiteKey: validatedData.captchaSiteKey || null,
        captchaSecretKey: validatedData.captchaSecretKey || null,

        // PRO: Branding
        hideBranding: validatedData.hideBranding || false,

        // PRO: Custom Theme
        customTheme: validatedData.customTheme ? validatedData.customTheme : Prisma.JsonNull,
      },
    });

    console.log("✅ Configurações salvas com sucesso:");
    console.log("  → notifyEmail:", settings.notifyEmail || "(não configurado)");
    console.log(
      "  → notifyEmails:",
      settings.notifyEmails.length > 0 ? settings.notifyEmails.join(", ") : "(nenhum)"
    );
    console.log("  → webhookUrl:", settings.webhookUrl || "(não configurado)");
    console.log("  → captchaEnabled:", settings.captchaEnabled);
    console.log("  → captchaProvider:", settings.captchaProvider || "(não configurado)");
    console.log("  → hideBranding:", settings.hideBranding);
    console.log("  → customTheme:", settings.customTheme ? "configurado" : "(padrão)");

    // Verificar se as variáveis de ambiente de email estão configuradas
    const hasNotifyEmails = settings.notifyEmail || settings.notifyEmails.length > 0;
    if (hasNotifyEmails) {
      const hasResendKey = !!process.env.AUTH_RESEND_KEY;
      const hasEmailFrom = !!process.env.AUTH_EMAIL_FROM;

      if (!hasResendKey || !hasEmailFrom) {
        console.warn(
          "⚠️ AVISO: Email de notificação configurado, mas variáveis de ambiente faltando:"
        );
        if (!hasResendKey) console.warn("  → AUTH_RESEND_KEY não está configurada");
        if (!hasEmailFrom) console.warn("  → AUTH_EMAIL_FROM não está configurada");
        console.warn("  → Os emails NÃO serão enviados até que as variáveis sejam configuradas.");
      } else {
        console.log("✅ Variáveis de email configuradas corretamente.");
        console.log("  → AUTH_EMAIL_FROM:", process.env.AUTH_EMAIL_FROM);
      }
    }

    // Verificar configuração de CAPTCHA
    if (settings.captchaEnabled) {
      if (!settings.captchaSiteKey || !settings.captchaSecretKey) {
        console.warn("⚠️ AVISO: CAPTCHA habilitado mas chaves não configuradas");
      } else {
        console.log("✅ CAPTCHA configurado corretamente com provider:", settings.captchaProvider);
      }
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
  }
}
