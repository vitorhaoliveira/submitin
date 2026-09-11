"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@submitin/ui/components/radio-group";
import { Lock, ArrowRight, Loader2, CheckCircle, FileText } from "lucide-react";

/**
 * Mock interativo de uma "janela de navegador" mostrando o formulário público
 * real do Submitin (mesmo layout de public-form.tsx). Ao enviar, exibe o estado
 * de sucesso animado. Puro React + CSS, sem imagens externas.
 */
export function ProductPreview() {
  const t = useTranslations("landing");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [subject, setSubject] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("submitting");
    setTimeout(() => setStatus("done"), 1100);
  }

  const subjectOptions = [0, 1, 2].map((i) => t(`demo.form.subjectOptions.${i}`));

  return (
    <div className="relative">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-muted/40">
          <span className="w-3 h-3 rounded-full bg-zinc-300" />
          <span className="w-3 h-3 rounded-full bg-zinc-300" />
          <span className="w-3 h-3 rounded-full bg-zinc-300" />
          <div className="ml-3 flex-1 flex items-center gap-2 h-6 px-3 rounded-md bg-background border border-border text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span className="truncate">submitin.app/f/contato</span>
          </div>
        </div>

        {/* Página pública do formulário (espelha public-form.tsx) */}
        <div className="p-5 sm:p-6">
          {/* Branding header */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center">
              <FileText className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-sm">Submitin</span>
          </div>

          {status === "done" ? (
            <Card className="text-center animate-pop-in">
              <CardContent className="pt-10 pb-8">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">{t("demo.form.successTitle")}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("demo.form.successSubtitle")}
                </p>
                <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
                  {t("hero.ctaSecondary")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t("demo.form.title")}</CardTitle>
                <CardDescription>{t("demo.form.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2 animate-fade-in-up animation-delay-100">
                    <Label htmlFor="hp-name" className="flex items-center gap-1">
                      {t("demo.form.nameLabel")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input id="hp-name" placeholder={t("demo.form.namePlaceholder")} />
                  </div>

                  <div className="space-y-2 animate-fade-in-up animation-delay-200">
                    <Label htmlFor="hp-email" className="flex items-center gap-1">
                      {t("demo.form.emailLabel")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="hp-email"
                      type="email"
                      placeholder={t("demo.form.emailPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2 animate-fade-in-up animation-delay-300">
                    <Label className="flex items-center gap-1">
                      {t("demo.form.subjectLabel")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup value={subject} onValueChange={setSubject}>
                      {subjectOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`hp-subj-${option}`} />
                          <Label
                            htmlFor={`hp-subj-${option}`}
                            className="font-normal cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    className="w-full animate-fade-in-up animation-delay-400"
                    size="lg"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t("demo.form.submitting")}
                      </>
                    ) : (
                      <>
                        {t("demo.form.submit")}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Powered by */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {t("demo.form.poweredBy")}
          </p>
        </div>
      </div>
    </div>
  );
}
