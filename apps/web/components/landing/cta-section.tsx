import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { ArrowRight, Check } from "lucide-react";

export async function CtaSection() {
  const t = await getTranslations("landing");
  const proof = [0, 1, 2].map((i) => t(`trust.guarantees.${i}`));

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 px-6 py-16 md:py-20 text-center shadow-2xl shadow-indigo-600/20">
        {/* Glows decorativos */}
        <div
          className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-white/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -right-10 w-80 h-80 rounded-full bg-amber-400/30 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-lg md:text-2xl text-indigo-100 mb-9">{t("cta.subtitle")}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 text-base md:text-lg bg-white text-indigo-700 hover:bg-white/90"
              asChild
            >
              <Link href="/dashboard/forms/new">
                {t("cta.button")}
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 md:h-14 px-8 text-base md:text-lg border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="#templates">{t("cta.secondary")}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
            {proof.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-sm text-indigo-100">
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
