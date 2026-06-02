import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { Zap, ArrowRight, Check } from "lucide-react";
import { ProductPreview } from "./product-preview";

export async function HeroSection() {
  const t = await getTranslations("landing");
  const microProof = t("hero.microProof");

  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 bg-grid -z-10" aria-hidden />
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm animate-fade-in-up">
              <Zap className="w-4 h-4" />
              {t("hero.badge")}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] animate-fade-in-up animation-delay-100">
              {t("hero.title")}{" "}
              <span className="text-gradient">{t("hero.titleHighlight")}</span>{" "}
              {t("hero.titleEnd")}
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-delay-200">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-in-up animation-delay-300">
              <Button size="lg" className="text-base px-8 w-full sm:w-auto" asChild>
                <Link href="/dashboard/forms/new">
                  {t("hero.cta")}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 w-full sm:w-auto"
                asChild
              >
                <Link href="#demo">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>

            <p className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground animate-fade-in-up animation-delay-400">
              <Check className="w-4 h-4 text-primary shrink-0" />
              {microProof}
            </p>
          </div>

          {/* Interactive product preview */}
          <div className="animate-fade-in-up animation-delay-300 lg:pl-4">
            <ProductPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
