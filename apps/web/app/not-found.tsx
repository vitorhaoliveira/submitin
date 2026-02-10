import { buildMetadata } from "@/lib/seo";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";
import { NotFoundContent } from "@/components/not-found-content";

export async function generateMetadata() {
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("errors");
  return buildMetadata({
    title: t("notFound.title"),
    description: t("notFound.subtitle"),
    noIndex: true,
    locale: locale === "en" ? "en" : "pt_BR",
  });
}

export default function NotFound() {
  return <NotFoundContent />;
}
