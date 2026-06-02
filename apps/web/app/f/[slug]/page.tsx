import { prisma } from "@submitin/database";
import { notFound } from "next/navigation";
import { PublicForm } from "@/components/public-form";
import { parseVisibility } from "@/lib/field-visibility";
import { getFormAvailability } from "@/lib/form-availability";
import { buildMetadata } from "@/lib/seo";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";
import type { CustomTheme } from "@/lib/theme-utils";

// Conteúdo dinâmico: conta views e depende de estado mutável (agendamento,
// limite de respostas). Sem isto, o Next cacheia a rota e o form mostra estado
// desatualizado (ex.: "encerrado" após reabrir, ou views congeladas).
export const dynamic = "force-dynamic";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("publicForm");
  const form = await prisma.form.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!form) {
    return buildMetadata({
      title: t("errors.notFound"),
      noIndex: true,
      locale: locale === "en" ? "en" : "pt_BR",
    });
  }

  const title = form.name;
  const description =
    form.description || `${t("seoDescriptionFallback")} ${form.name}`;
  return buildMetadata({
    title,
    description,
    path: `/f/${slug}`,
    keywords: ["formulário", form.name, "pesquisa", "survey"],
    locale: locale === "en" ? "en" : "pt_BR",
  });
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;
  const form = await prisma.form.findFirst({
    where: {
      slug,
      published: true,
    },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
      settings: true,
    },
  });

  if (!form) {
    notFound();
  }

  // Conta a visualização (base para a taxa de conversão no analytics).
  // Falha silenciosa: um erro aqui nunca deve quebrar o formulário público.
  try {
    await prisma.form.update({
      where: { id: form.id },
      data: { views: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }

  // Transform JsonValue options to string[] | null
  const transformedForm = {
    id: form.id,
    name: form.name,
    description: form.description,
    fields: form.fields.map((field: (typeof form.fields)[number]) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      order: field.order,
      formId: field.formId,
      options: Array.isArray(field.options) ? (field.options as string[]) : null,
      visibility: parseVisibility(field.visibility),
    })),
    // Incluir settings para features Pro
    settings: form.settings
      ? {
          hideBranding: form.settings.hideBranding,
          conversational: form.settings.conversational ?? false,
          customTheme: form.settings.customTheme as CustomTheme | null,
          captchaEnabled: form.settings.captchaEnabled,
          captchaProvider: form.settings.captchaProvider as "turnstile" | "hcaptcha" | null,
          captchaSiteKey: form.settings.captchaSiteKey,
          allowMultipleResponses: form.settings.allowMultipleResponses ?? false,
          thankYouTitle: form.settings.thankYouTitle,
          thankYouMessage: form.settings.thankYouMessage,
          thankYouRedirectUrl: form.settings.thankYouRedirectUrl,
          opensAt: form.settings.opensAt ? form.settings.opensAt.toISOString() : null,
          closesAt: form.settings.closesAt ? form.settings.closesAt.toISOString() : null,
          maxResponses: form.settings.maxResponses,
          closedMessage: form.settings.closedMessage,
          capturePartials: form.settings.capturePartials ?? false,
        }
      : null,
  };

  // Disponibilidade (agendamento/limites) avaliada no servidor.
  const responseCount = await prisma.response.count({ where: { formId: form.id } });
  const availability = getFormAvailability(
    form.settings
      ? {
          opensAt: form.settings.opensAt,
          closesAt: form.settings.closesAt,
          maxResponses: form.settings.maxResponses,
          closedMessage: form.settings.closedMessage,
        }
      : null,
    responseCount
  );

  return <PublicForm form={transformedForm} availability={availability} />;
}
