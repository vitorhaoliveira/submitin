"use client";

import { useState } from "react";
import Link from "next/link";
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
import { FileText, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSent(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok && response.status === 400) {
        setError(data.error || t("errors.generic"));
        return;
      }

      setSent(true);
    } catch (err) {
      console.error("Erro ao solicitar reset:", err);
      setError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

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

        <Card className="animate-fade-in-up animation-delay-100">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("forgot.title")}</CardTitle>
            <CardDescription>{t("forgot.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-3 text-sm">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {t("forgot.successMessage")}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {t("forgot.checkInbox")}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">{t("forgot.backToLogin")}</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.emailLabel")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive flex-1">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("forgot.submitting")}
                    </>
                  ) : (
                    t("forgot.submit")
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("back")} {t("forgot.toLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
