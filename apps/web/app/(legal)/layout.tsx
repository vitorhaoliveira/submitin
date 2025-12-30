import Link from "next/link";
import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("legal");
  const tLanding = await getTranslations("landing");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">{tCommon("appName")}</span>
          </Link>
        </div>

        {/* Content */}
        <article className="prose prose-invert prose-emerald max-w-none">
          {children}
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/termos" className="hover:text-foreground transition-colors">
              {tLanding("footer.terms")}
            </Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              {tLanding("footer.privacy")}
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              {t("backHome")}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
