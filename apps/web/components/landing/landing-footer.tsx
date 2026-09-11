import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { Button } from "@submitin/ui/components/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "@/lib/utils";

export async function LandingFooter() {
  const t = await getTranslations("landing");

  const productLinks = [
    { href: "#como-funciona", label: t("nav.howItWorks") },
    { href: "#documentos", label: t("nav.documents") },
    { href: "#recursos", label: t("nav.features") },
    { href: "#faq", label: t("nav.faq") },
  ];

  const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors";

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
          {/* Marca */}
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <Logo markClassName="w-9 h-9" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.tagline")}</p>
            <Button asChild>
              <Link href="/register">
                {t("footer.ctaButton")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Colunas de links agrupadas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-8">
            <div>
              <h4 className="font-medium text-sm mb-3">{t("footer.productTitle")}</h4>
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
              <h4 className="font-medium text-sm mb-3">{t("footer.legalTitle")}</h4>
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
              <h4 className="font-medium text-sm mb-3">{t("footer.support")}</h4>
              <a
                href={SUPPORT_PHONE_TEL}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-foreground" />
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
