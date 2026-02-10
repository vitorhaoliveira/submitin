import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
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
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={session.user} />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

