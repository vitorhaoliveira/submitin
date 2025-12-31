"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
import { FileText, Mail, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica se há erro na URL (vindo do NextAuth)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      // Extrai o código de erro (pode vir em vários formatos)
      let errorCode: string = errorParam;
      
      // Remove query strings e paths
      if (errorCode.includes("?")) {
        const urlParams = new URLSearchParams(errorCode.split("?")[1] || "");
        const errorFromParams = urlParams.get("error");
        errorCode = errorFromParams || errorCode.split("?")[0] || "Unknown";
      }
      if (errorCode.includes("=")) {
        errorCode = errorCode.split("=")[0] || "Unknown";
      }
      if (errorCode.includes("/")) {
        errorCode = errorCode.split("/").pop() || errorCode || "Unknown";
      }
      
      // Log para debug
      if (process.env.NODE_ENV === "development") {
        console.group("🔍 URL Error Param Debug");
        console.error("Raw error param:", errorParam);
        console.error("Parsed error code:", errorCode);
        console.groupEnd();
      }
      
      // Mapeia erros específicos
      const errorLower = errorCode.toLowerCase();
      if (errorLower.includes("configuration") || errorParam.toLowerCase().includes("configuration")) {
        setError(t("errors.configuration"));
      } else if (errorLower.includes("accessdenied") || errorParam.toLowerCase().includes("accessdenied")) {
        setError(t("errors.accessDenied"));
      } else if (errorLower.includes("verification") || errorParam.toLowerCase().includes("verification")) {
        setError(t("errors.verification"));
      } else {
        setError(`${t("errors.sendFailed")} (${errorCode})`);
      }
    }
  }, [searchParams, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      // NextAuth pode retornar ok: true mesmo com erro (quando provider não está configurado)
      // Por isso verificamos primeiro se há erro, independente do status ok
      if (result?.error) {
        // Extrai o código de erro (pode vir em vários formatos)
        // Exemplos: "Configuration", "Configuration?error=Configuration", "/login?error=Configuration"
        let errorCode: string = result.error;
        
        // Remove query strings e paths
        if (errorCode.includes("?")) {
          const urlParams = new URLSearchParams(errorCode.split("?")[1] || "");
          const errorFromParams = urlParams.get("error");
          errorCode = errorFromParams || errorCode.split("?")[0] || "Unknown";
        }
        if (errorCode.includes("=")) {
          errorCode = errorCode.split("=")[0] || "Unknown";
        }
        if (errorCode.includes("/")) {
          errorCode = errorCode.split("/").pop() || errorCode || "Unknown";
        }
        
        // Log detalhado para debug (apenas em desenvolvimento)
        if (process.env.NODE_ENV === "development") {
          console.group("🔍 NextAuth Error Debug");
          console.error("Raw error:", result.error);
          console.error("Parsed error code:", errorCode);
          console.error("Full result:", result);
          console.error("⚠️ Nota: ok:true com error indica que o provider não está configurado");
          console.groupEnd();
        }
        
        // Mapeia erros específicos do NextAuth para mensagens mais claras
        let errorMessage = t("errors.sendFailed");
        
        const errorLower = errorCode.toLowerCase();
        if (errorLower.includes("configuration") || result.error.toLowerCase().includes("configuration")) {
          errorMessage = t("errors.configuration");
        } else if (errorLower.includes("accessdenied") || result.error.toLowerCase().includes("accessdenied")) {
          errorMessage = t("errors.accessDenied");
        } else if (errorLower.includes("verification") || result.error.toLowerCase().includes("verification")) {
          errorMessage = t("errors.verification");
        } else {
          // Se não reconhecer o erro, mostra uma mensagem genérica mas informativa
          errorMessage = `${t("errors.sendFailed")} (${errorCode})`;
        }
        
        setError(errorMessage);
      } else if (result?.ok && !result?.error) {
        // Só redireciona se realmente não houver erro
        window.location.href = "/login/verify?email=" + encodeURIComponent(email);
      } else {
        // Caso fallback: se não há erro explícito mas também não está ok
        setError(t("errors.sendFailed"));
      }
    } catch (err) {
      console.error("Erro ao enviar email:", err);
      setError(t("errors.sendFailed"));
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
            <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
            <CardDescription>
              {t("login.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive text-left flex-1">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("login.submitting")}
                  </>
                ) : (
                  <>
                    {t("login.submit")}
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t("login.noAccount")}
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
