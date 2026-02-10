import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { Badge } from "@submitin/ui/components/badge";
import {
  FileText,
  Zap,
  Share2,
  BarChart3,
  ArrowRight,
  Mail,
  Code2,
  Webhook,
  Shield,
  Lock,
  Check,
  Crown,
  Sparkles,
  Palette,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PLANS } from "@/lib/stripe";
import { buildMetadata, getBaseUrl } from "@/lib/seo";
import { getLocaleFromCookie } from "@/lib/i18n";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocaleFromCookie();
  const t = await getTranslations("landing");
  const keywordsStr = t("seo.keywords");
  const keywords = keywordsStr ? keywordsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
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
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg">Submitin</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="#pricing">
                {t("nav.pricing")}
              </Link>
            </Button>
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                {t("nav.login")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">
                {t("nav.getStarted")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm animate-fade-in-up">
              <Zap className="w-4 h-4" />
              {t("hero.badge")}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in-up animation-delay-100">
              {t("hero.title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {t("hero.titleHighlight")}
              </span>{" "}
              {t("hero.titleEnd")}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Button size="lg" className="text-base px-8" asChild>
                <Link href="/login">
                  {t("hero.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8" asChild>
                <Link href="#features">
                  {t("hero.ctaSecondary")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Features Preview - Grid Principal */}
          <div className="mt-24 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title={t("features.builder.title")}
              description={t("features.builder.description")}
              delay="100"
            />
            <FeatureCard
              icon={<Share2 className="w-6 h-6" />}
              title={t("features.links.title")}
              description={t("features.links.description")}
              delay="200"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title={t("features.analytics.title")}
              description={t("features.analytics.description")}
              delay="300"
            />
          </div>
        </section>

        {/* All Features Section */}
        <section id="features" className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("features.sectionTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("features.sectionSubtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Mail className="w-6 h-6" />}
              title={t("features.email.title")}
              description={t("features.email.description")}
              delay="100"
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title={t("features.embed.title")}
              description={t("features.embed.description")}
              delay="150"
            />
            <FeatureCard
              icon={<Webhook className="w-6 h-6" />}
              title={t("features.webhooks.title")}
              description={t("features.webhooks.description")}
              delay="200"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title={t("features.secureLogin.title")}
              description={t("features.secureLogin.description")}
              delay="250"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title={t("features.security.title")}
              description={t("features.security.description")}
              delay="300"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title={t("features.performance.title")}
              description={t("features.performance.description")}
              delay="350"
            />
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-24 bg-muted/30">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("pricing.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("pricing.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border-2">
              <CardHeader>
                <CardTitle className="text-2xl">{PLANS.free.name}</CardTitle>
                <CardDescription>{t("pricing.free.description")}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${PLANS.free.price}</span>
                  <span className="text-muted-foreground ml-2">{t("pricing.perMonth")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{t(`pricing.free.features.${index}` as any)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">
                    {t("pricing.free.cta")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-primary shadow-xl">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1">
                  {t("pricing.pro.badge")}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {PLANS.pro.name}
                  <Crown className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription>{t("pricing.pro.description")}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${PLANS.pro.price}</span>
                  <span className="text-muted-foreground ml-2">{t("pricing.perMonth")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{t(`pricing.pro.features.${index}` as any)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" asChild>
                  <Link href="/login">
                    {t("pricing.pro.cta")}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Pro Features Showcase */}
        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-sm mb-4">
              <Crown className="w-4 h-4" />
              {t("proFeatures.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("proFeatures.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("proFeatures.subtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Palette className="w-6 h-6" />}
              title={t("proFeatures.customTheme.title")}
              description={t("proFeatures.customTheme.description")}
              delay="100"
              isPro
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title={t("proFeatures.captcha.title")}
              description={t("proFeatures.captcha.description")}
              delay="150"
              isPro
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title={t("proFeatures.unlimitedResponses.title")}
              description={t("proFeatures.unlimitedResponses.description")}
              delay="200"
              isPro
            />
            <FeatureCard
              icon={<Crown className="w-6 h-6" />}
              title={t("proFeatures.removeBranding.title")}
              description={t("proFeatures.removeBranding.description")}
              delay="250"
              isPro
            />
            <FeatureCard
              icon={<Mail className="w-6 h-6" />}
              title={t("proFeatures.prioritySupport.title")}
              description={t("proFeatures.prioritySupport.description")}
              delay="300"
              isPro
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title={t("proFeatures.advancedAnalytics.title")}
              description={t("proFeatures.advancedAnalytics.description")}
              delay="350"
              isPro
            />
          </div>
        </section>

        {/* Comparison Table */}
        <section className="container mx-auto px-4 py-24 bg-muted/30">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("comparison.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("comparison.subtitle")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">{t("comparison.features")}</th>
                      <th className="text-center p-4 font-semibold">{t("comparison.free")}</th>
                      <th className="text-center p-4 font-semibold bg-yellow-500/10">{t("comparison.pro")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      feature={t("comparison.forms")}
                      free={t("comparison.formsLimit")}
                      pro={t("comparison.formsUnlimited")}
                    />
                    <ComparisonRow
                      feature={t("comparison.responsesPerMonth")}
                      free={t("comparison.responsesLimit")}
                      pro={t("comparison.responsesUnlimited")}
                    />
                    <ComparisonRow
                      feature={t("comparison.emailNotifications")}
                      free={true}
                      pro={true}
                    />
                    <ComparisonRow
                      feature={t("comparison.webhooks")}
                      free={true}
                      pro={true}
                    />
                    <ComparisonRow
                      feature={t("comparison.customTheme")}
                      free={false}
                      pro={true}
                    />
                    <ComparisonRow
                      feature={t("comparison.removeBranding")}
                      free={false}
                      pro={true}
                    />
                    <ComparisonRow
                      feature={t("comparison.captcha")}
                      free={false}
                      pro={true}
                    />
                    <ComparisonRow
                      feature={t("comparison.support")}
                      free={t("comparison.supportCommunity")}
                      pro={t("comparison.supportPriority")}
                    />
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="glass rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/login">
                {t("cta.button")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Submitin. {t("footer.copyright")}</p>
            <div className="flex items-center gap-6">
              <a
                href={SUPPORT_PHONE_TEL}
                className="hover:text-foreground transition-colors"
                rel="noopener noreferrer"
              >
                {t("footer.support")} {SUPPORT_PHONE_DISPLAY}
              </a>
              <Link href="/termos" className="hover:text-foreground transition-colors">
                {t("footer.terms")}
              </Link>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">
                {t("footer.privacy")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
  isPro = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
  isPro?: boolean;
}) {
  return (
    <div
      className={`glass rounded-xl p-6 text-left animate-fade-in-up animation-delay-${delay} ${isPro ? "border-2 border-yellow-500/20" : ""
        }`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isPro
        ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-500"
        : "bg-primary/10 text-primary"
        }`}>
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {isPro && <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />}
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function ComparisonRow({
  feature,
  free,
  pro,
}: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-600 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-red-500 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <td className="p-4 font-medium">{feature}</td>
      <td className="p-4 text-center">{renderValue(free)}</td>
      <td className="p-4 text-center bg-yellow-500/5">{renderValue(pro)}</td>
    </tr>
  );
}
