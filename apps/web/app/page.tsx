import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";
import { buildMetadata, getBaseUrl } from "@/lib/seo";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { StatsBand } from "@/components/landing/stats-band";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TemplatesGallery } from "@/components/landing/templates-gallery";
import { FeaturesSection } from "@/components/landing/features-section";
import { DemoSection } from "@/components/landing/demo-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("landing");
  const keywordsStr = t("seo.keywords");
  const keywords = keywordsStr
    ? keywordsStr.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return buildMetadata({
    title: t("seo.title"),
    description: t("hero.subtitle"),
    path: "/",
    keywords,
    locale: locale === "en" ? "en" : "pt_BR",
  });
}

export default async function HomePage() {
  const t = await getTranslations("landing");
  const locale = await getLocaleFromCookie();
  const baseUrl = getBaseUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Submitin",
        description: t("hero.subtitle"),
        url: baseUrl,
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: locale === "en" ? "USD" : "BRL",
        },
      },
      {
        "@type": "Organization",
        name: "Submitin",
        url: baseUrl,
        logo: `${baseUrl}/icon.svg`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingHeader />

      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <StatsBand />
        <DemoSection />
        <TemplatesGallery />
        <HowItWorks />
        <FeaturesSection />
        <FaqSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
