import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { FileText, MessageCircle, ArrowRight } from "lucide-react";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "@/lib/utils";

export async function LandingFooter() {
  const t = await getTranslations("landing");

  const productLinks = [
    { href: "#demo", label: t("nav.howItWorks") },
    { href: "#templates", label: t("nav.templates") },
    { href: "#features", label: t("features.sectionTitle") },
    { href: "#faq", label: t("faq.title") },
  ];

  const linkClass =
    "text-base text-muted-foreground hover:text-primary transition-colors";

  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container mx-auto px-4 py-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
          {/* Marca */}
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-xl">Submitin</span>
            </Link>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
            <Button asChild>
              <Link href="/dashboard/forms/new">
                {t("footer.ctaButton")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Colunas de links agrupadas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-8">
            <div>
              <h4 className="font-semibold text-base mb-3">{t("footer.productTitle")}</h4>
              <ul className="space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3">{t("footer.legalTitle")}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/termos" className={linkClass}>
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className={linkClass}>
                    {t("footer.privacy")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3">{t("footer.support")}</h4>
              <a
                href={SUPPORT_PHONE_TEL}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-primary" />
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-base text-muted-foreground">
          <span>© {new Date().getFullYear()} Submitin</span>
          <span>{t("footer.copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
