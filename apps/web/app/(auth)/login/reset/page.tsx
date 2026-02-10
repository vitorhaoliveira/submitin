"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n-context";
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
  FileText,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordRequirements: PasswordRequirement[] = useMemo(
    () => [
      { label: t("register.password.minLength"), test: (p) => p.length >= 8 },
      { label: t("register.password.uppercase"), test: (p) => /[A-Z]/.test(p) },
      { label: t("register.password.number"), test: (p) => /[0-9]/.test(p) },
      {
        label: t("register.password.special"),
        test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
      },
    ],
    [t]
  );

  const isNewPasswordValid = useMemo(
    () => passwordRequirements.every((req) => req.test(newPassword)),
    [newPassword, passwordRequirements]
  );
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = token && newPassword && confirmPassword && isNewPasswordValid && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("reset.invalidToken"));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(data.redirectUrl || "/login");
      }, 2000);
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="animate-fade-in-up animation-delay-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("reset.title")}</CardTitle>
          <CardDescription>{t("reset.invalidToken")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login/forgot">{t("forgot.title")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="animate-fade-in-up animation-delay-100">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-3 text-sm">
            <Check className="w-5 h-5 shrink-0" />
            {t("reset.successMessage")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up animation-delay-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("reset.title")}</CardTitle>
        <CardDescription>{t("reset.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("reset.newPasswordLabel")}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder={t("reset.newPasswordPlaceholder")}
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
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
                        valid
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {valid ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("reset.confirmPasswordLabel")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("reset.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive">
                {t("reset.passwordsDoNotMatch")}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("reset.submitting")}
              </>
            ) : (
              t("reset.submit")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-xl">{tCommon("appName")}</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent className="py-8">
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("back")}
          </Link>
        </p>
      </div>
    </div>
  );
}
