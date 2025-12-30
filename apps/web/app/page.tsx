import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@form-builder/ui/components/button";
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
  Sparkles,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function HomePage() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg">Form Builder</span>
          </Link>
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                {t("nav.getStarted")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
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
              <Link href="/login">
                <Button size="lg" className="text-base px-8">
                  {t("hero.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-base px-8">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
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
              icon={<Sparkles className="w-6 h-6" />}
              title={t("features.magicLink.title")}
              description={t("features.magicLink.description")}
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

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="glass rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <Link href="/login">
              <Button size="lg" className="text-base px-8">
                {t("cta.button")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Form Builder. {t("footer.copyright")}</p>
            <div className="flex items-center gap-6">
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className={`glass rounded-xl p-6 text-left animate-fade-in-up animation-delay-${delay}`}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
