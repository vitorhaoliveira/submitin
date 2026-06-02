"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@submitin/ui/components/card";
import {
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
  User as UserIcon,
  Mail,
  CalendarDays,
  FileText,
  MessageSquare,
  TrendingUp,
  Crown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PLANS, isPaid, maxFormsFor, maxResponsesPerMonthFor } from "@/lib/stripe";
import { formatDate } from "@/lib/utils";

interface AccountClientProps {
  profile: {
    id: string;
    name: string | null;
    email: string;
    plan: string;
    createdAt: string;
  };
  usage: { forms: number; published: number; responses: number };
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export function AccountClient({ profile, usage }: AccountClientProps) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const { update } = useSession();

  const isPro = isPaid(profile.plan);
  const maxForms = maxFormsFor(profile.plan);
  const maxResponses = maxResponsesPerMonthFor(profile.plan);

  // ---- Perfil (editar nome) ----
  const [name, setName] = useState(profile.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const nameChanged = name.trim() !== (profile.name ?? "").trim() && name.trim().length > 0;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!nameChanged) {
      setProfileMsg({ type: "err", text: t("noChanges") });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "err", text: data.error || tAuth("errors.generic") });
        return;
      }
      setProfileMsg({ type: "ok", text: t("profileSaved") });
      // Reflete o novo nome na sessão (sidebar/header) sem recarregar
      await update?.();
    } catch {
      setProfileMsg({ type: "err", text: tAuth("errors.generic") });
    } finally {
      setSavingProfile(false);
    }
  }

  // ---- Senha ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordRequirements: PasswordRequirement[] = useMemo(
    () => [
      { label: tAuth("register.password.minLength"), test: (p) => p.length >= 8 },
      { label: tAuth("register.password.uppercase"), test: (p) => /[A-Z]/.test(p) },
      { label: tAuth("register.password.number"), test: (p) => /[0-9]/.test(p) },
      {
        label: tAuth("register.password.special"),
        test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
      },
    ],
    [tAuth]
  );

  const isNewPasswordValid = useMemo(
    () => passwordRequirements.every((req) => req.test(newPassword)),
    [newPassword, passwordRequirements]
  );
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid =
    currentPassword && newPassword && confirmPassword && isNewPasswordValid && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || tAuth("errors.generic"));
        return;
      }
      setSuccess(data.message || t("changePasswordSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      setError(tAuth("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  const initials = (name || profile.email).trim().slice(0, 2).toUpperCase();
  const localeTag = locale === "en" ? "en-US" : "pt-BR";

  const usageStats = [
    {
      key: "forms",
      label: t("formsUsage"),
      value: usage.forms,
      limit: maxForms === -1 ? null : maxForms,
      icon: FileText,
      tint: "bg-primary/10 text-primary",
    },
    {
      key: "responses",
      label: t("responsesUsage"),
      value: usage.responses,
      limit: maxResponses === -1 ? null : maxResponses,
      icon: MessageSquare,
      tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      key: "published",
      label: t("publishedUsage"),
      value: usage.published,
      limit: null,
      icon: TrendingUp,
      tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Cabeçalho do perfil + plano */}
      <Card className="overflow-hidden">
        <div className="bg-brand-soft p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-brand-gradient text-white flex items-center justify-center text-xl font-semibold shadow-sm shadow-primary/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold truncate">{name || profile.email.split("@")[0]}</h2>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          </div>
          <div
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              isPro
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isPro ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {isPro ? t("planPro") : t("planFree")}
          </div>
        </div>
      </Card>

      {/* Uso */}
      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">{t("usageTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("usageDescription")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {usageStats.map((s) => {
            const Icon = s.icon;
            const pct =
              s.limit && s.limit > 0 ? Math.min(100, Math.round((s.value / s.limit) * 100)) : null;
            const showUnlimited = s.limit === null && (s.key === "forms" || s.key === "responses");
            return (
              <Card key={s.key}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tint}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold mt-2 tabular-nums">
                    {s.value}
                    {s.limit && s.limit > 0 ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        {t("ofLimit").replace("{limit}", String(s.limit))}
                      </span>
                    ) : showUnlimited ? (
                      <span className="text-sm font-normal text-muted-foreground"> · {t("unlimited")}</span>
                    ) : null}
                  </p>
                  {pct !== null && (
                    <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-brand-gradient"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {!isPro && (
          <Card className="mt-4 overflow-hidden border-primary/20 bg-brand-soft">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-gradient text-white flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{t("upgradeCta")}</p>
                  <p className="text-sm text-muted-foreground">{PLANS.premium.features[1]}</p>
                </div>
              </div>
              <Link href="/dashboard/billing" className="shrink-0">
                <Button>
                  {t("upgradeCta")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Perfil (editar nome) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5" />
            {t("profileTitle")}
          </CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileMsg && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  profileMsg.type === "ok"
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {profileMsg.type === "ok" ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {profileMsg.text}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("nameLabel")}</Label>
                <Input
                  id="name"
                  value={name}
                  placeholder={t("namePlaceholder")}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" value={profile.email} disabled className="pl-9 opacity-70" />
                </div>
                <p className="text-xs text-muted-foreground">{t("emailReadonly")}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!nameChanged || savingProfile} className="gap-2">
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("saveProfile")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Detalhes da conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              {t("memberSince")}
            </span>
            <span className="text-sm font-medium">{formatDate(profile.createdAt, localeTag)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="w-4 h-4" />
              {t("planLabel")}
            </span>
            <Link href="/dashboard/billing" className="text-sm font-medium text-primary hover:underline">
              {isPro ? t("planPro") : t("planFree")} · {t("managePlan")}
            </Link>
          </div>
          <div className="flex items-center justify-between py-3 last:pb-0">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="w-4 h-4" />
              {t("accountId")}
            </span>
            <span className="text-sm font-mono text-muted-foreground">{profile.id}</span>
          </div>
        </CardContent>
      </Card>

      {/* Segurança (senha) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" />
            {t("changePasswordTitle")}
          </CardTitle>
          <CardDescription>{t("changePasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-2 text-sm">
                <Check className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("currentPasswordLabel")}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder={t("currentPasswordPlaceholder")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrent((s) => !s)}
                  aria-label={showCurrent ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPasswordLabel")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder={t("newPasswordPlaceholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNew((s) => !s)}
                  aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {newPassword && (
                <ul className="text-xs space-y-1 mt-1">
                  {passwordRequirements.map((req) => {
                    const valid = req.test(newPassword);
                    return (
                      <li
                        key={req.label}
                        className={`flex items-center gap-2 ${
                          valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`}
                      >
                        {valid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">{t("passwordsDoNotMatch")}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!isFormValid || isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
