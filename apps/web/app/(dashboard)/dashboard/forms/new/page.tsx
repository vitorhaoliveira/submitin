import { auth } from "@/lib/auth";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";
import { FormBuilder } from "@/components/form-builder";
import { getFormTemplates } from "@/lib/form-templates";
import { NewFormClient } from "./new-form-client";
import { GuestTemplatePicker } from "./guest-template-picker";

export default async function NewFormPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; blank?: string }>;
}) {
  const session = await auth();

  // Usuário logado: seletor de modelos (cria via API)
  if (session?.user) {
    return <NewFormClient />;
  }

  // Visitante (sem login): seletor de modelos
  const { template, blank } = await searchParams;

  // Sem modelo escolhido ainda: mostra os mesmos modelos prontos do usuário logado
  if (!template && !blank) {
    return <GuestTemplatePicker />;
  }

  // Modelo escolhido (ou "em branco"): abre o construtor em modo convidado
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("guest");

  const tpl = template
    ? getFormTemplates(locale === "en" ? "en" : "pt").find((x) => x.id === template)
    : null;

  const fields = tpl
    ? tpl.fields.map((f, i) => ({
        id: `g${i}`,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder ?? null,
        required: f.required ?? false,
        order: i,
        options: f.options ?? null,
      }))
    : [];

  const guestForm = {
    id: "guest",
    slug: "meu-formulario",
    name: tpl?.name ?? t("untitled"),
    description: tpl?.description ?? "",
    published: false,
    fields,
    settings: null,
  };

  return <FormBuilder guest form={guestForm} />;
}
