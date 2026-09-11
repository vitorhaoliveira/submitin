import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { ArrowRight, Check } from "lucide-react";
import { Dash, OkBubble, PaperDoodle, Sparkle, Squiggle, Star } from "./doodles";
import { FormToPdf } from "./form-to-pdf";

export async function HeroSection() {
  const t = await getTranslations("landing");

  return (
    <section className="relative overflow-hidden">
      {/* Rabiscos soltos (só desktop) */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <OkBubble className="absolute left-[4%] top-[18%] w-20 text-foreground/70 -rotate-6" />
        <Dash className="absolute left-[3%] top-[50%] w-7 text-pop" />
        <PaperDoodle className="absolute left-[3%] bottom-[10%] w-12 text-foreground/60 rotate-12" />
        <Star className="absolute right-[4%] top-[12%] w-8 text-foreground/60 rotate-12" />
        <Dash className="absolute right-[8%] bottom-[18%] w-6 text-foreground/30" />
      </div>

      <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-10 items-center">
          <div className="text-center lg:text-left space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm font-medium">
              <Sparkle className="w-4 h-4 text-pop" />
              {t("hero.badge")}
            </span>

            <h1 className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight">
              {t("hero.title")}{" "}
              <span className="text-brand">
                {t("hero.titleEnd")}{" "}
                <span className="relative inline-block">
                  {t("hero.titleHighlight")}
                  <Squiggle className="absolute -bottom-2 left-0 h-3 w-full text-pop" />
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-base" asChild>
                <Link href="/register">
                  {t("hero.cta")}
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 text-base"
                asChild
              >
                <Link href="#como-funciona">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>

            <p className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-brand shrink-0" />
              {t("hero.microProof")}
            </p>
          </div>

          <FormToPdf />
        </div>
      </div>
    </section>
  );
}
