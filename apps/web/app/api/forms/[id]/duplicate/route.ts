import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, Prisma } from "@submitin/database";
import { generateSlug } from "@/lib/utils";
import { maxFormsFor } from "@/lib/stripe";

// POST /api/forms/[id]/duplicate — cria uma cópia do formulário (campos + configurações)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Respeita o limite de formulários do plano (-1 = ilimitado)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const maxForms = maxFormsFor(user?.plan);
    if (maxForms !== -1) {
      const formCount = await prisma.form.count({ where: { userId: session.user.id } });
      if (formCount >= maxForms) {
        return NextResponse.json(
          {
            error: `Limite de ${maxForms} formulários atingido. Faça upgrade do seu plano para criar mais.`,
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    const original = await prisma.form.findFirst({
      where: { id, userId: session.user.id },
      include: { fields: true, settings: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const s = original.settings;

    const newForm = await prisma.form.create({
      data: {
        name: `${original.name} (cópia)`,
        description: original.description,
        slug: generateSlug(),
        userId: session.user.id,
        published: false,
        fields: {
          create: original.fields.map((f) => ({
            type: f.type,
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
            order: f.order,
            options: f.options === null ? Prisma.DbNull : f.options,
          })),
        },
        settings: s
          ? {
              create: {
                notifyEmail: s.notifyEmail,
                notifyEmails: s.notifyEmails,
                webhookUrl: s.webhookUrl,
                allowMultipleResponses: s.allowMultipleResponses,
                thankYouTitle: s.thankYouTitle,
                thankYouMessage: s.thankYouMessage,
                thankYouRedirectUrl: s.thankYouRedirectUrl,
                confirmationEmail: s.confirmationEmail,
                captchaEnabled: s.captchaEnabled,
                captchaProvider: s.captchaProvider,
                captchaSiteKey: s.captchaSiteKey,
                captchaSecretKey: s.captchaSecretKey,
                hideBranding: s.hideBranding,
                customTheme: s.customTheme === null ? Prisma.DbNull : s.customTheme,
              },
            }
          : undefined,
      },
      include: {
        _count: { select: { responses: true, fields: true } },
      },
    });

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error("Error duplicating form:", error);
    return NextResponse.json({ error: "Erro ao duplicar formulário" }, { status: 500 });
  }
}
