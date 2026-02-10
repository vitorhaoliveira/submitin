"use client";

import { useState, useMemo } from "react";
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
import { Lock, Loader2, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export default function AccountPage() {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
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
    currentPassword &&
    newPassword &&
    confirmPassword &&
    isNewPasswordValid &&
    passwordsMatch;

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
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
                          valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
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

            <Button type="submit" disabled={!isFormValid || isLoading} className="w-full gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
