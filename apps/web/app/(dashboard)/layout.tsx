import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { documentUsageFor } from "@/lib/usage";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@submitin/database";
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
  const userId = session?.user?.id;
  const [usage] = await Promise.all([
    userId ? documentUsageFor(userId) : null,
    // Último acesso (área admin): no máximo uma escrita por hora por conta.
    userId
      ? prisma.user
          .updateMany({
            where: { id: userId, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(Date.now() - 3_600_000) } }] },
            data: { lastSeenAt: new Date() },
          })
          .catch(() => null)
      : null,
  ]);
  const isAdmin = isAdminEmail(session?.user?.email);

  return (
    <>
      <ClaimGuestDraft />
      <DashboardShell user={session?.user ?? null} usage={usage} isAdmin={isAdmin}>
        {children}
      </DashboardShell>
    </>
  );
}

