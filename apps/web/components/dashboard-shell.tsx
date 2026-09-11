"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations, useLocale, useI18n } from "@/lib/i18n-context";
import { cn } from "@submitin/ui/lib/utils";
import {
  FileText,
  FileCheck2,
  LayoutDashboard,
  Plus,
  Menu,
  X,
  LogOut,
  LogIn,
  Settings,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/logo";

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

  // Restaura preferência da sidebar
  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  // Fecha o drawer ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const mainNav = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/forms", label: t("forms"), icon: FileText },
    { href: "/dashboard/documents", label: t("documents"), icon: FileCheck2 },
  ];
  const generalNav = [
    { href: "/dashboard/account", label: t("account"), icon: Settings },
    { href: "/dashboard/billing", label: t("billing"), icon: CreditCard },
  ];

  function Brand({ compact }: { compact: boolean }) {
    return (
      <Link
        href={user ? "/dashboard" : "/"}
        className="flex items-center gap-2 min-w-0"
        aria-label={tCommon("appName")}
      >
        <Logo markClassName="w-7 h-7" textClassName="text-lg" showText={!compact} />
      </Link>
    );
  }

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
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          compact && "justify-center px-0 py-2",
          active
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", active && "text-brand")} />
        {!compact && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  function SectionLabel({ label, compact }: { label: string; compact: boolean }) {
    return compact ? (
      <div className="mx-2 my-3 h-px bg-border" />
    ) : (
      <p className="px-2.5 pt-5 pb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
    );
  }

  // Conteúdo interno da sidebar (reutilizado no desktop e no drawer mobile)
  function SidebarBody({ forceExpanded = false }: { forceExpanded?: boolean }) {
    const compact = forceExpanded ? false : collapsed;
    const footerBtn = cn(
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors",
      compact ? "justify-center px-0 py-2" : "w-full"
    );
    return (
      <div className="flex h-full flex-col p-3">
        {/* Topo: marca + recolher */}
        <div className={cn("flex items-center h-10 px-1", compact ? "justify-center" : "justify-between")}>
          <Brand compact={compact} />
          {!compact && !forceExpanded && (
            <button
              onClick={() => setCollapsed(true)}
              title={t("collapse")}
              aria-label={t("collapse")}
              className="hidden md:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Criar formulário */}
        <Link
          href="/dashboard/forms/new"
          title={compact ? t("quickCreate") : undefined}
          aria-label={t("quickCreate")}
          className={cn(
            "mt-3 flex h-8 items-center gap-2 rounded-full border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-muted",
            compact ? "justify-center" : "px-2.5"
          )}
        >
          <Plus className="w-4 h-4" />
          {!compact && t("quickCreate")}
        </Link>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto">
          {user ? (
            <>
              <SectionLabel label={t("sectionMain")} compact={compact} />
              <div className="space-y-0.5">
                {mainNav.map((i) => (
                  <NavLink key={i.href} {...i} compact={compact} />
                ))}
              </div>
              <SectionLabel label={t("sectionGeneral")} compact={compact} />
              <div className="space-y-0.5">
                {generalNav.map((i) => (
                  <NavLink key={i.href} {...i} compact={compact} />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-0.5 pt-4">
              <NavLink href="/login" label={t("login")} icon={LogIn} compact={compact} />
            </div>
          )}
        </nav>

        {/* Rodapé: idioma + usuário */}
        <div className="space-y-1 border-t pt-3">
          <button
            onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
            title={locale === "pt" ? "English" : "Português"}
            className={footerBtn}
          >
            <Globe className="w-4 h-4 shrink-0" />
            {!compact && <span>{locale === "pt" ? "Português" : "English"}</span>}
          </button>

          {user ? (
            <div className={cn("flex items-center gap-2.5 rounded-md px-1.5 py-1.5", compact && "justify-center")}>
              <div className="w-7 h-7 shrink-0 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-medium">
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
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            !compact && (
              <Link
                href="/register"
                className="flex h-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("signup")}
              </Link>
            )
          )}

          {/* Expandir (quando recolhido) */}
          {compact && !forceExpanded && (
            <button
              onClick={() => setCollapsed(false)}
              title={t("expand")}
              aria-label={t("expand")}
              className="hidden md:flex w-full justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden md:block border-r bg-muted/30 transition-[width] duration-200 ease-out",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        <SidebarBody />
      </aside>

      {/* Top bar mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted"
          aria-label={t("menu")}
        >
          <Menu className="w-5 h-5" />
        </button>
        <Brand compact={false} />
        <Link
          href="/dashboard/forms/new"
          aria-label={t("quickCreate")}
          className="p-2 -mr-2 rounded-md hover:bg-muted"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-background border-r shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 z-10 p-1.5 rounded-md text-muted-foreground hover:bg-muted"
              aria-label={tCommon("close")}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarBody forceExpanded />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className={cn("transition-[padding] duration-200 ease-out", collapsed ? "md:pl-[60px]" : "md:pl-60")}>
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
