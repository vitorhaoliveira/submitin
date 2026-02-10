import { buildMetadata } from "@/lib/seo";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";

export async function generateMetadata() {
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("auth");
  return buildMetadata({
    title: t("reset.title"),
    description: t("reset.subtitle"),
    path: "/login/reset",
    noIndex: true,
    locale: locale === "en" ? "en" : "pt_BR",
  });
}

export default function ResetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
