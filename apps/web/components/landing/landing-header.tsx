"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

export function LandingHeader() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/#como-funciona", label: t("nav.howItWorks") },
    { href: "/#documentos", label: t("nav.documents") },
    { href: "/#recursos", label: t("nav.features") },
    { href: "/modelos", label: t("nav.templates") },
    { href: "/precos", label: t("nav.pricing") },
    { href: "/#faq", label: t("nav.faq") },
  ];

  return (
    <header className="border-b bg-background/90 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo markClassName="w-8 h-8" />
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
            <Link href="/dashboard/documents/new">
              {t("nav.getStarted")}
              <ArrowRight />
            </Link>
          </Button>
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
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
            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border">
              <Button variant="outline" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/documents/new" onClick={() => setOpen(false)}>
                  {t("nav.getStarted")}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
