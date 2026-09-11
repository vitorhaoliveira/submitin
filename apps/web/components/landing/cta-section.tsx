import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { ArrowRight } from "lucide-react";
import { CurlyArrow, OkBubble, Squiggle, Star } from "./doodles";

export async function CtaSection() {
  const t = await getTranslations("landing");

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-16 md:py-24 text-center text-background">
        <OkBubble className="absolute left-6 top-8 hidden w-20 text-background/40 md:block -rotate-6" />
        <Star className="absolute right-10 top-10 hidden w-8 text-pop md:block" />
        <CurlyArrow className="absolute right-[12%] bottom-10 hidden w-24 text-background/30 md:block rotate-12" />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            {t("cta.title")}
          </h2>
          <Squiggle className="mx-auto mt-3 h-3 w-48 text-pop" />
          <p className="mt-5 text-lg md:text-xl text-background/70">{t("cta.subtitle")}</p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-7 text-base bg-brand text-brand-foreground hover:bg-brand/90"
              asChild
            >
              <Link href="/register">
                {t("cta.button")}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-7 text-base border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link href="#como-funciona">{t("cta.secondary")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
