import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { ArrowRight, Check } from "lucide-react";

export async function CtaSection() {
  const t = await getTranslations("landing");
  const proof = [0, 1, 2].map((i) => t(`trust.guarantees.${i}`));

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-16 md:py-20 text-center">
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-background mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-lg md:text-xl text-background/70 mb-9">{t("cta.subtitle")}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link href="/dashboard/forms/new">
                {t("cta.button")}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link href="#templates">{t("cta.secondary")}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
            {proof.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-sm text-background/70">
                <Check className="w-4 h-4 shrink-0" />
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
