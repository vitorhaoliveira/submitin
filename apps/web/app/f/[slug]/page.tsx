import { prisma } from "@submitin/database";
import { notFound } from "next/navigation";
import { PublicForm } from "@/components/public-form";
import { parseVisibility } from "@/lib/field-visibility";
import { getFormAvailability } from "@/lib/form-availability";
import { buildMetadata } from "@/lib/seo";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";
import type { CustomTheme } from "@/lib/theme-utils";
import { activeTemplateKeys, resolveNatures } from "@/lib/documents/natures";
import { toDocumentFieldType } from "@/lib/documents/service";
import { formatValue } from "@submitin/documents/format";
import { brandLogoUrl } from "@/lib/branding";

// Conteúdo dinâmico: conta views e depende de estado mutável (agendamento,
// limite de respostas). Sem isto, o Next cacheia a rota e o form mostra estado
// desatualizado (ex.: "encerrado" após reabrir, ou views congeladas).
export const dynamic = "force-dynamic";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string }>;
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

export default async function PublicFormPage({ params, searchParams }: PublicFormPageProps) {
  const [{ slug }, { c: inviteToken }] = await Promise.all([params, searchParams]);
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
      document: {
        select: {
          id: true,
          emailRespondent: true,
          templates: { orderBy: { version: "desc" }, take: 1, select: { variables: true } },
        },
      },
      user: { select: { id: true, brandName: true, brandLogoKey: true } },
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

  // Link personalizado (?c=token): campos que a empresa já preencheu para este cliente.
  const invite =
    typeof inviteToken === "string" && inviteToken
      ? await prisma.formInvite.findUnique({ where: { token: inviteToken } })
      : null;
  const inviteProblem =
    typeof inviteToken === "string" && inviteToken
      ? !invite || invite.formId !== form.id
        ? "invalid"
        : invite.usedAt
          ? "used"
          : null
      : null;
  const inviteValues =
    invite && !inviteProblem ? ((invite.values ?? {}) as Record<string, string>) : {};
  const { locked, askedIds, fromInvite } = resolveNatures(
    form.fields,
    inviteValues,
    new Date(),
    activeTemplateKeys(form.document?.templates[0]?.variables)
  );
  // O respondente vê, só para leitura, o que o link já trouxe preenchido para ele.
  const prefilled = form.fields
    .filter((f) => fromInvite.has(f.id))
    .map((f) => ({
      label: f.label,
      value: formatValue(toDocumentFieldType(f.type), locked[f.id]!),
    }));

  // Transform JsonValue options to string[] | null
  const transformedForm = {
    id: form.id,
    name: form.name,
    description: form.description,
    // Só aparecem os campos que o respondente responde.
    fields: form.fields.filter((field) => askedIds.has(field.id)).map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      helpText: field.helpText,
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

  const brand =
    form.user.brandName || form.user.brandLogoKey
      ? { name: form.user.brandName, logoUrl: brandLogoUrl(form.user.id, form.user.brandLogoKey) }
      : undefined;

  if (inviteProblem) {
    return (
      <PublicForm
        form={transformedForm}
        availability={{ isOpen: false, reason: inviteProblem === "used" ? "inviteUsed" : "inviteInvalid" }}
        brand={brand}
      />
    );
  }

  return (
    <PublicForm
      form={transformedForm}
      availability={availability}
      invite={invite ? { token: invite.token, prefilled } : undefined}
      isDocument={Boolean(form.document)}
      respondentCopy={
        Boolean(form.document?.emailRespondent) &&
        form.fields.some((f) => f.type === "email" && askedIds.has(f.id))
      }
      brand={brand}
    />
  );
}
