import { notFound, redirect } from "next/navigation";
import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";
import { DocumentDetailClient } from "@/components/documents/document-detail-client";
import type { CustomTheme } from "@/lib/theme-utils";
import { appBaseUrl } from "@/lib/documents/service";
import { hasFeature, isPaid, isPremium } from "@/lib/stripe";

export const metadata = {
  title: "Documento",
};

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      templates: { orderBy: { version: "desc" }, take: 1 },
      form: {
        include: {
          fields: { orderBy: { order: "asc" } },
          settings: true,
        },
      },
      _count: { select: { generations: true } },
    },
  });
  const invites = document
    ? await prisma.formInvite.findMany({
        where: { formId: document.formId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, token: true, label: true, usedAt: true, createdAt: true },
      })
    : [];
  if (!document) notFound();

  const template = document.templates[0];
  const { form } = document;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { plan: true } });
  const st = form.settings;
  const emails = [
    ...new Set(
      [form.settings?.notifyEmail, ...(form.settings?.notifyEmails ?? [])].filter(
        (e): e is string => Boolean(e)
      )
    ),
  ];

  return (
    <DocumentDetailClient
      document={{
        id: document.id,
        name: document.name,
        submissions: document._count.generations,
      }}
      form={{
        id: form.id,
        slug: form.slug,
        published: form.published,
        fields: form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          variableKey: f.variableKey,
          nature: (["pergunta", "fixa", "pre_preenchida", "automatica"].includes(f.nature)
            ? f.nature
            : "pergunta") as "pergunta" | "fixa" | "pre_preenchida" | "automatica",
          defaultValue: f.defaultValue,
          helpText: f.helpText,
          options: Array.isArray(f.options) ? (f.options as string[]) : null,
        })),
      }}
      invites={invites.map((i) => ({
        ...i,
        usedAt: i.usedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      }))}
      template={
        template
          ? {
              version: template.version,
              fileName: template.fileName,
              createdAt: template.createdAt.toISOString(),
              variables: template.variables,
              missingFonts: template.missingFonts,
            }
          : null
      }
      formSettings={{
        description: form.description ?? "",
        requireAcceptance: document.requireAcceptance,
        conversational: st?.conversational ?? false,
        thankYouTitle: st?.thankYouTitle ?? "",
        thankYouMessage: st?.thankYouMessage ?? "",
        thankYouRedirectUrl: st?.thankYouRedirectUrl ?? "",
        hideBranding: st?.hideBranding ?? false,
        customTheme: (st?.customTheme as CustomTheme | null) ?? null,
        opensAt: st?.opensAt?.toISOString() ?? null,
        closesAt: st?.closesAt?.toISOString() ?? null,
        maxResponses: st?.maxResponses ?? null,
        closedMessage: st?.closedMessage ?? "",
        captchaEnabled: st?.captchaEnabled ?? false,
        captchaProvider: (st?.captchaProvider as "turnstile" | "hcaptcha" | null) ?? null,
        captchaSiteKey: st?.captchaSiteKey ?? "",
        captchaSecretKey: st?.captchaSecretKey ?? "",
      }}
      plan={{
        paid: isPaid(user.plan),
        top: isPremium(user.plan),
        acceptance: hasFeature(user.plan, "electronicAcceptance"),
      }}
      publicUrl={`${appBaseUrl()}/f/${form.slug}`}
      delivery={{
        emails,
        webhookUrl: form.settings?.webhookUrl ?? "",
        emailRespondent: document.emailRespondent,
        hasEmailField: form.fields.some((f) => f.type === "email" && f.nature === "pergunta"),
      }}
    />
  );
}
