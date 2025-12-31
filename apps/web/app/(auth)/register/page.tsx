"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { FileText, Mail, Lock, User, Loader2, ArrowLeft, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Requisitos de senha com validação em tempo real
  const passwordRequirements: PasswordRequirement[] = useMemo(() => [
    { label: t("register.password.minLength"), test: (p) => p.length >= 8 },
    { label: t("register.password.uppercase"), test: (p) => /[A-Z]/.test(p) },
    { label: t("register.password.number"), test: (p) => /[0-9]/.test(p) },
    { label: t("register.password.special"), test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ], [t]);

  const isPasswordValid = useMemo(() => {
    return passwordRequirements.every((req) => req.test(password));
  }, [password, passwordRequirements]);

  const isFormValid = email && password && isPasswordValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Erros de validação específicos
          const firstError = Object.values(data.details).flat()[0];
          setError(firstError as string || data.error);
        } else {
          setError(data.error || t("errors.generic"));
        }
        return;
      }

      // Sucesso - redireciona para login
      router.push("/login?registered=true");
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      setError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
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
            <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
            <CardDescription>
              {t("register.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("register.nameLabel")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("register.namePlaceholder")}
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("register.emailLabel")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("register.passwordLabel")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("register.passwordPlaceholder")}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Validação de senha em tempo real */}
                {password && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-1.5">
                    {passwordRequirements.map((req, index) => {
                      const isValid = req.test(password);
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-xs transition-colors ${
                            isValid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                          }`}
                        >
                          {isValid ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive text-left flex-1">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("register.submitting")}
                  </>
                ) : (
                  t("register.submit")
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                {t("register.hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  {t("register.login")}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
          <Link
            href="/"
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

