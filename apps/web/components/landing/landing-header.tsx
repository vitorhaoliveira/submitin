"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FileText, ArrowRight, Menu, X } from "lucide-react";

export function LandingHeader() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "#demo", label: t("nav.howItWorks") },
    { href: "#templates", label: t("nav.templates") },
    { href: "#features", label: t("features.sectionTitle") },
    { href: "#faq", label: t("faq.title") },
  ];

  return (
    <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-lg">Submitin</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/forms/new">
              {t("nav.getStarted")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border/50">
              <Button variant="outline" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/forms/new" onClick={() => setOpen(false)}>
                  {t("nav.getStarted")}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
