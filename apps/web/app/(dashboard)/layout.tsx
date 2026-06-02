import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { ClaimGuestDraft } from "@/components/claim-guest-draft";
import { buildMetadata } from "@/lib/seo";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";

export async function generateMetadata() {
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("dashboard");
  return buildMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    noIndex: true,
    locale: locale === "en" ? "en" : "pt_BR",
  });
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Visitantes (sem login) podem acessar o app; cada página que depende de conta
  // se protege individualmente. Ações de salvar/publicar acionam o cadastro.
  const session = await auth();

  return (
    <>
      <ClaimGuestDraft />
      <DashboardShell user={session?.user ?? null}>{children}</DashboardShell>
    </>
  );
}

