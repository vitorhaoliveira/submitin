"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations, useLocale, useI18n } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import {
  FileText,
  LayoutDashboard,
  Plus,
  Menu,
  X,
  LogOut,
  LogIn,
  Settings,
  CreditCard,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Globe,
} from "lucide-react";

type NavUser = { name?: string | null; email?: string | null } | null;

interface DashboardShellProps {
  user: NavUser;
  children: React.ReactNode;
}

const COLLAPSE_KEY = "submitin_sidebar_collapsed";

function initials(user: NavUser): string {
  const base = user?.name || user?.email || "?";
  const parts = base.trim().split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || base[0] || "?").toUpperCase();
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const { setLocale } = useI18n();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Restaura preferências salvas (sidebar + tema), sem next-themes
  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  // Fecha o drawer ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const mainNav = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/forms", label: t("forms"), icon: FileText },
  ];
  const generalNav = [
    { href: "/dashboard/account", label: t("account"), icon: Settings },
    { href: "/dashboard/billing", label: t("billing"), icon: CreditCard },
  ];

  const Brand = (
    <Link
      href={user ? "/dashboard" : "/"}
      className="flex items-center gap-2.5 min-w-0"
      aria-label={tCommon("appName")}
    >
      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-gradient flex items-center justify-center shadow-sm shadow-primary/30">
        <FileText className="w-5 h-5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <span className="font-semibold text-lg tracking-tight truncate">
          {tCommon("appName")}
        </span>
      )}
    </Link>
  );

  function NavLink({
    href,
    label,
    icon: Icon,
    compact,
  }: {
    href: string;
    label: string;
    icon: typeof FileText;
    compact: boolean;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        title={compact ? label : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          compact ? "justify-center" : ""
        } ${
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
        )}
        <Icon className="w-[1.15rem] h-[1.15rem] shrink-0" />
        {!compact && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  // Conteúdo interno da sidebar (reutilizado no desktop e no drawer mobile)
  function SidebarBody({ forceExpanded = false }: { forceExpanded?: boolean }) {
    const compact = forceExpanded ? false : collapsed;
    const footerBtn = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
      compact ? "justify-center" : "w-full"
    }`;
    return (
      <div className="flex h-full flex-col gap-2 p-3">
        {/* Topo: brand + recolher */}
        <div className={`flex items-center ${compact ? "justify-center" : "justify-between"} h-12 px-1`}>
          {Brand}
          {!compact && !forceExpanded && (
            <button
              onClick={() => setCollapsed(true)}
              title={t("collapse")}
              aria-label={t("collapse")}
              className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* CTA criar formulário */}
        <Link href="/dashboard/forms/new" className="block">
          {compact ? (
            <Button size="icon" className="w-full" title={t("quickCreate")} aria-label={t("quickCreate")}>
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="w-full justify-start gap-2">
              <Plus className="w-4 h-4" />
              {t("quickCreate")}
            </Button>
          )}
        </Link>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto">
          {user ? (
            <>
              {compact ? (
                <div className="mx-3 my-2 h-px bg-border" />
              ) : (
                <p className="px-3 pt-4 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t("sectionMain")}
                </p>
              )}
              <div className="space-y-1">
                {mainNav.map((i) => (
                  <NavLink key={i.href} {...i} compact={compact} />
                ))}
              </div>
              {compact ? (
                <div className="mx-3 my-2 h-px bg-border" />
              ) : (
                <p className="px-3 pt-4 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t("sectionGeneral")}
                </p>
              )}
              <div className="space-y-1">
                {generalNav.map((i) => (
                  <NavLink key={i.href} {...i} compact={compact} />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-1 pt-2">
              <NavLink href="/login" label={t("login")} icon={LogIn} compact={compact} />
            </div>
          )}
        </nav>

        {/* Rodapé: preferências + usuário */}
        <div className="space-y-1 border-t border-border pt-2">
          <button onClick={toggleTheme} title={t("toggleTheme")} aria-label={t("toggleTheme")} className={footerBtn}>
            {isDark ? (
              <Sun className="w-[1.15rem] h-[1.15rem] shrink-0" />
            ) : (
              <Moon className="w-[1.15rem] h-[1.15rem] shrink-0" />
            )}
            {!compact && <span>{isDark ? t("lightMode") : t("darkMode")}</span>}
          </button>

          <button
            onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
            title={locale === "pt" ? "English" : "Português"}
            className={footerBtn}
          >
            <Globe className="w-[1.15rem] h-[1.15rem] shrink-0" />
            {!compact && <span>{locale === "pt" ? "Português" : "English"}</span>}
          </button>

          {user ? (
            <div
              className={`mt-1 flex items-center gap-3 rounded-xl px-2 py-2 ${
                compact ? "justify-center" : "bg-muted/40"
              }`}
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                {initials(user)}
              </div>
              {!compact && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate">
                      {user.name || user.email?.split("@")[0]}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    title={t("logout")}
                    aria-label={t("logout")}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            !compact && (
              <Link href="/register" className="block pt-1">
                <Button variant="outline" className="w-full">
                  {t("signup")}
                </Button>
              </Link>
            )
          )}

          {/* Expandir (quando recolhido) */}
          {compact && !forceExpanded && (
            <button
              onClick={() => setCollapsed(false)}
              title={t("expand")}
              aria-label={t("expand")}
              className="hidden md:flex w-full justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial">
      {/* Sidebar desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:block border-r border-border bg-background transition-[width] duration-200 ease-out ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <SidebarBody />
      </aside>

      {/* Top bar mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-muted"
          aria-label={t("menu")}
        >
          <Menu className="w-5 h-5" />
        </button>
        {Brand}
        <Link href="/dashboard/forms/new" aria-label={t("quickCreate")}>
          <Button size="icon" variant="ghost">
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-background border-r border-border shadow-xl animate-pop-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label={tCommon("close")}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarBody forceExpanded />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div
        className={`transition-[padding] duration-200 ease-out ${
          collapsed ? "md:pl-[76px]" : "md:pl-64"
        }`}
      >
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
