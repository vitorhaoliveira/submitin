"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Textarea } from "@submitin/ui/components/textarea";
import { Label } from "@submitin/ui/components/label";
import { Checkbox } from "@submitin/ui/components/checkbox";
import { RadioGroup, RadioGroupItem } from "@submitin/ui/components/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@submitin/ui/components/card";
import { FileText, Loader2, CheckCircle, ArrowRight, ArrowLeft, Star, Clock, Lock, Check } from "lucide-react";
import { cn } from "@submitin/ui/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { Captcha, type CaptchaProvider } from "./captcha";
import { generateThemeStyles, type CustomTheme } from "@/lib/theme-utils";
import { computeVisibleFieldIds, type VisibilityRule } from "@/lib/field-visibility";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  visibility?: VisibilityRule | null;
}

interface FormSettings {
  hideBranding?: boolean;
  customTheme?: CustomTheme | null;
  captchaEnabled?: boolean;
  captchaProvider?: CaptchaProvider | null;
  captchaSiteKey?: string | null;
  allowMultipleResponses?: boolean;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  thankYouRedirectUrl?: string | null;
  closedMessage?: string | null;
  capturePartials?: boolean;
  conversational?: boolean;
}

interface Form {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
  settings?: FormSettings | null;
}

interface PublicFormProps {
  form: Form;
  availability?: { isOpen: boolean; reason: string };
}

// Tempo médio de preenchimento por tipo de campo (em segundos). Usado para o
// badge "leva ~X min", que reduz a ansiedade de início e aumenta a conclusão.
const SECONDS_PER_FIELD: Record<string, number> = {
  textarea: 40,
  text: 15,
  email: 18,
  phone: 18,
  number: 12,
  date: 12,
  select: 10,
  checkbox: 5,
  rating: 8,
};

// Peças de confete com configs determinísticas (evita Math.random em render e
// mantém a animação estável). Cores da marca + emerald de sucesso.
const CONFETTI_PIECES = [
  { left: "6%", color: "#6366f1", delay: "0s", dur: "2.7s", x: "-24px", rot: "520deg" },
  { left: "16%", color: "#f59e0b", delay: "0.15s", dur: "2.4s", x: "18px", rot: "-480deg" },
  { left: "26%", color: "#10b981", delay: "0.05s", dur: "2.9s", x: "-12px", rot: "600deg" },
  { left: "36%", color: "#8b5cf6", delay: "0.25s", dur: "2.5s", x: "26px", rot: "-420deg" },
  { left: "46%", color: "#6366f1", delay: "0.1s", dur: "3.0s", x: "-30px", rot: "560deg" },
  { left: "56%", color: "#f59e0b", delay: "0.3s", dur: "2.6s", x: "14px", rot: "-500deg" },
  { left: "66%", color: "#10b981", delay: "0.08s", dur: "2.8s", x: "-18px", rot: "440deg" },
  { left: "76%", color: "#8b5cf6", delay: "0.2s", dur: "2.5s", x: "22px", rot: "-560deg" },
  { left: "86%", color: "#6366f1", delay: "0.12s", dur: "2.9s", x: "-16px", rot: "480deg" },
  { left: "94%", color: "#f59e0b", delay: "0.28s", dur: "2.6s", x: "20px", rot: "-520deg" },
  { left: "11%", color: "#10b981", delay: "0.35s", dur: "2.7s", x: "16px", rot: "500deg" },
  { left: "41%", color: "#8b5cf6", delay: "0.4s", dur: "2.4s", x: "-22px", rot: "-460deg" },
  { left: "61%", color: "#6366f1", delay: "0.18s", dur: "3.0s", x: "12px", rot: "540deg" },
  { left: "81%", color: "#f59e0b", delay: "0.33s", dur: "2.8s", x: "-26px", rot: "-500deg" },
];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CONFETTI_PIECES.map((c, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: c.left,
              backgroundColor: c.color,
              "--confetti-delay": c.delay,
              "--confetti-dur": c.dur,
              "--confetti-x": c.x,
              "--confetti-rot": c.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function PublicForm({ form, availability }: PublicFormProps) {
  const t = useTranslations("publicForm");
  const tCommon = useTranslations("common");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  // Modo conversacional: índice da pergunta atual.
  const [step, setStep] = useState(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extrair configurações do formulário
  const settings = form.settings;
  const hideBranding = settings?.hideBranding ?? false;
  const customTheme = settings?.customTheme ?? null;
  const captchaEnabled = settings?.captchaEnabled ?? false;
  const captchaProvider = settings?.captchaProvider ?? null;
  const captchaSiteKey = settings?.captchaSiteKey ?? null;
  const allowMultipleResponses = settings?.allowMultipleResponses ?? false;
  const conversational = settings?.conversational ?? false;
  const thankYouTitle = settings?.thankYouTitle || null;
  const thankYouMessage = settings?.thankYouMessage || null;
  const thankYouRedirectUrl = settings?.thankYouRedirectUrl || null;

  // Redireciona após o envio, se configurado
  useEffect(() => {
    if (isSubmitted && thankYouRedirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = thankYouRedirectUrl;
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, thankYouRedirectUrl]);

  // Gerar estilos do tema customizado
  const themeStyles = generateThemeStyles(customTheme);

  // Lógica condicional: ids dos campos visíveis dados os valores atuais
  const visibleFieldIds = useMemo(
    () => computeVisibleFieldIds(form.fields, values),
    [form.fields, values]
  );
  const visibleFields = form.fields.filter((f) => visibleFieldIds.has(f.id));

  // Tempo estimado de preenchimento (apenas campos atualmente visíveis).
  const estimatedSeconds = useMemo(
    () => visibleFields.reduce((sum, f) => sum + (SECONDS_PER_FIELD[f.type] ?? 15), 0),
    [visibleFields]
  );
  const estimatedMinutes = Math.max(1, Math.round(estimatedSeconds / 60));
  const showShortTime = estimatedSeconds < 60;

  // Validação de um único campo (usada tanto no blur quanto no submit).
  function getFieldError(field: Field, value: string | undefined): string | null {
    const filled =
      field.type === "checkbox" ? value === "true" : Boolean(value && value.trim());

    if (field.required && !filled) {
      return t("errors.required");
    }

    if (field.type === "email" && value && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return t("errors.invalidEmail");
      }
    }

    return null;
  }

  // Campo "válido" para feedback positivo (✓): só após interação, preenchido e
  // sem erro. Checkbox não recebe ✓ — a própria marcação já é o feedback.
  function isFieldValid(field: Field): boolean {
    if (!touched[field.id] || field.type === "checkbox") return false;
    const value = values[field.id];
    if (!value || !value.trim()) return false;
    return getFieldError(field, value) === null;
  }

  // Classe de estado para inputs de texto: erro (vermelho) ou válido (verde).
  function inputStateClass(field: Field): string {
    return cn(
      errors[field.id] && "border-destructive focus-visible:ring-destructive/40",
      isFieldValid(field) && "border-emerald-500/60 focus-visible:ring-emerald-500/40"
    );
  }

  function handleChange(fieldId: string, value: string, markTouched = false) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (markTouched) {
      setTouched((prev) => ({ ...prev, [fieldId]: true }));
    }
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  // Validação inline: ao sair do campo, marca como tocado e mostra erro/✓.
  function handleBlur(field: Field) {
    setTouched((prev) => ({ ...prev, [field.id]: true }));
    const error = getFieldError(field, values[field.id]);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[field.id] = error;
      else delete next[field.id];
      return next;
    });
  }

  // Respostas parciais (PRO): ao sair de um campo, salva um rascunho se o dono
  // ativou a captura. O backend só persiste quando há contato preenchido.
  const partialIdRef = useRef<string | null>(null);
  const savingPartialRef = useRef(false);

  async function savePartial() {
    if (!settings?.capturePartials || isSubmitted) return;
    if (savingPartialRef.current) return;
    // Sem nenhum valor ainda → nada a salvar
    if (!Object.values(values).some((v) => v && v.trim())) return;

    savingPartialRef.current = true;
    try {
      const res = await fetch(`/api/forms/${form.id}/partial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, partialId: partialIdRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.partialId) partialIdRef.current = data.partialId;
      }
    } catch {
      /* rascunho é best-effort; nunca atrapalha o preenchimento */
    } finally {
      savingPartialRef.current = false;
    }
  }

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token);
    setCaptchaError(false);
    // Limpa erro de captcha se existir
    if (errors._captcha) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next._captcha;
        return next;
      });
    }
  }

  function handleCaptchaError() {
    setCaptchaError(true);
    setCaptchaToken(null);
  }

  function handleCaptchaExpire() {
    setCaptchaToken(null);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    for (const field of form.fields) {
      // Campos ocultos por lógica condicional não são validados
      if (!visibleFieldIds.has(field.id)) continue;

      newTouched[field.id] = true;
      const error = getFieldError(field, values[field.id]);
      if (error) newErrors[field.id] = error;
    }

    // Validar CAPTCHA se habilitado
    if (captchaEnabled && captchaSiteKey && captchaProvider && !captchaToken) {
      newErrors._captcha = "Por favor, complete a verificação anti-spam";
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Envia apenas valores de campos visíveis (descarta respostas ocultas)
      const visibleValues: Record<string, string> = {};
      for (const id of Object.keys(values)) {
        if (visibleFieldIds.has(id)) visibleValues[id] = values[id]!;
      }

      const response = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: visibleValues,
          captchaToken: captchaEnabled ? captchaToken : undefined,
          // Converte a parcial deste lead em completa (sem duplicar)
          partialId: partialIdRef.current,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errors.submitFailed"));
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrors({
        _form: error instanceof Error ? error.message : t("errors.submitFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Renderização de campos (compartilhada entre página única e conversacional) ──

  // Tipos de texto em linha: Enter avança e mostramos a dica "pressione Enter".
  const ENTER_ADVANCE_TYPES = new Set(["text", "email", "phone", "number"]);

  // Renderiza apenas o controle do campo (sem label/erro), idêntico nos dois modos.
  // `onPick` dispara após uma escolha de toque único (usado pelo auto-advance).
  function renderControl(field: Field, onPick?: () => void): React.ReactNode {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.id}
            placeholder={field.placeholder || undefined}
            value={values[field.id] || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field)}
            className={inputStateClass(field)}
          />
        );
      case "textarea":
        return (
          <Textarea
            id={field.id}
            rows={4}
            placeholder={field.placeholder || undefined}
            value={values[field.id] || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field)}
            className={inputStateClass(field)}
          />
        );
      case "email":
        return (
          <Input
            id={field.id}
            type="email"
            placeholder={field.placeholder || "your@email.com"}
            value={values[field.id] || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field)}
            className={inputStateClass(field)}
          />
        );
      case "phone":
        return (
          <Input
            id={field.id}
            type="tel"
            inputMode="tel"
            placeholder={field.placeholder || "(11) 99999-9999"}
            value={values[field.id] || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field)}
            className={inputStateClass(field)}
          />
        );
      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder || undefined}
            value={values[field.id] || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field)}
            className={inputStateClass(field)}
          />
        );
      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            value={values[field.id] || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.id, e.target.value, true)}
            onBlur={() => handleBlur(field)}
            className={inputStateClass(field)}
          />
        );
      case "rating":
        return (
          <div className="flex items-center gap-1" role="radiogroup" aria-label={field.label}>
            {[1, 2, 3, 4, 5].map((star) => {
              const current = Number(values[field.id] || 0);
              const active = star <= current;
              return (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star}`}
                  aria-pressed={active}
                  onClick={() => {
                    handleChange(field.id, String(star), true);
                    onPick?.();
                  }}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>
        );
      case "select":
        return field.options ? (
          <RadioGroup
            value={values[field.id] || ""}
            onValueChange={(value: string) => {
              handleChange(field.id, value, true);
              onPick?.();
            }}
            className="gap-2.5"
          >
            {field.options.map((option: string) => {
              const selected = values[field.id] === option;
              return (
                <Label
                  key={option}
                  htmlFor={`${field.id}-${option}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer font-normal",
                    "transition-all duration-150 hover:border-ring/60 hover:bg-accent/40",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-input",
                    errors[field.id] && !selected && "border-destructive/50"
                  )}
                >
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <span className="flex-1 text-sm">{option}</span>
                  {selected && <Check className="w-4 h-4 text-primary animate-check-pop" aria-hidden />}
                </Label>
              );
            })}
          </RadioGroup>
        ) : null;
      case "checkbox":
        return (
          <Label
            htmlFor={field.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer font-normal",
              "transition-all duration-150 hover:border-ring/60 hover:bg-accent/40",
              values[field.id] === "true"
                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                : "border-input",
              errors[field.id] && values[field.id] !== "true" && "border-destructive/50"
            )}
          >
            <Checkbox
              id={field.id}
              checked={values[field.id] === "true"}
              onCheckedChange={(checked: boolean) =>
                handleChange(field.id, checked ? "true" : "false", true)
              }
            />
            <span className="flex-1 text-sm">{field.placeholder || tCommon("yes")}</span>
          </Label>
        );
      default:
        return null;
    }
  }

  // Bloco completo de um campo no modo página única: label + ✓ + controle + erro.
  function renderFieldBlock(field: Field, index: number): React.ReactNode {
    return (
      <div
        key={field.id}
        className="space-y-2 animate-fade-in-up"
        style={{ animationDelay: `${(index + 1) * 50}ms` }}
      >
        <div className="flex items-center justify-between gap-2 min-h-5">
          <Label
            htmlFor={field.id}
            className={cn("flex items-center gap-1", errors[field.id] && "text-destructive")}
          >
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          {isFieldValid(field) && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 animate-check-pop">
              <Check className="w-3.5 h-3.5" aria-hidden />
              {t("fieldValid")}
            </span>
          )}
        </div>
        {renderControl(field)}
        {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]}</p>}
      </div>
    );
  }

  // ── Navegação do modo conversacional ──
  const totalSteps = visibleFields.length;
  const clampedStep = Math.min(step, Math.max(0, totalSteps - 1));
  const currentField = visibleFields[clampedStep];
  const isLastStep = clampedStep >= totalSteps - 1;

  function clearAutoAdvance() {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }

  // Avança após escolha de toque único (com leve atraso para o usuário ver o ✓).
  function scheduleAutoAdvance() {
    if (!conversational) return;
    clearAutoAdvance();
    autoAdvanceRef.current = setTimeout(() => {
      autoAdvanceRef.current = null;
      setStep((s) => Math.min(s + 1, visibleFields.length - 1));
    }, 350);
  }

  function goNext() {
    clearAutoAdvance();
    const field = visibleFields[clampedStep];
    if (field) {
      setTouched((prev) => ({ ...prev, [field.id]: true }));
      const error = getFieldError(field, values[field.id]);
      if (error) {
        setErrors((prev) => ({ ...prev, [field.id]: error }));
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function goBack() {
    clearAutoAdvance();
    setStep((s) => Math.max(s - 1, 0));
  }

  // Enter avança em campos de texto em linha; textarea mantém quebra de linha.
  function handleStepKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    if (!isLastStep) {
      e.preventDefault();
      goNext();
    }
  }

  // Agendamento/limites: formulário fora da janela de respostas (avaliado no servidor)
  if (availability && !availability.isOpen) {
    const scheduled = availability.reason === "scheduled";
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-radial" style={themeStyles}>
        <Card className="max-w-md w-full text-center animate-fade-in-up">
          <CardContent className="pt-12 pb-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              {scheduled ? (
                <Clock className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Lock className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{form.name}</h2>
            <p className="text-muted-foreground">
              {scheduled
                ? t("closed.scheduled")
                : settings?.closedMessage || t("closed.message")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-radial overflow-hidden"
        style={themeStyles}
      >
        <Confetti />
        <Card className="relative max-w-md w-full text-center animate-fade-in-up">
          <CardContent className="pt-12 pb-8">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-success-ring" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 animate-pop-in" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{thankYouTitle || t("success.title")}</h2>
            <p className="text-muted-foreground mb-8">
              {thankYouMessage || t("success.subtitle")}
            </p>
            {thankYouRedirectUrl ? (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("success.redirecting")}
              </p>
            ) : (
              allowMultipleResponses && (
                <Button onClick={() => window.location.reload()} variant="outline">
                  {t("success.another")}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Modo conversacional: uma pergunta por vez ──
  if (conversational && totalSteps > 0 && currentField) {
    const progressPct = ((clampedStep + 1) / totalSteps) * 100;
    const showEnterHint = !isLastStep && ENTER_ADVANCE_TYPES.has(currentField.type);
    const showLastStepExtras = isLastStep;

    return (
      <div className="relative min-h-screen flex flex-col bg-gradient-radial" style={themeStyles}>
        {/* Barra de progresso fixa no topo */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-20">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <form onSubmit={handleSubmit} onBlur={() => void savePartial()} className="w-full max-w-xl">
            {!hideBranding && (
              <Link href="/" className="inline-flex items-center gap-2 mb-8 animate-fade-in-up">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold">{tCommon("appName")}</span>
              </Link>
            )}

            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {t("stepOf")
                  .replace("{current}", String(clampedStep + 1))
                  .replace("{total}", String(totalSteps))}
              </span>
              <span className="opacity-50">·</span>
              <span>{form.name}</span>
            </div>

            <div key={currentField.id} className="animate-fade-in-up space-y-5" onKeyDown={handleStepKeyDown}>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold leading-snug">
                  {currentField.label}
                  {currentField.required && <span className="text-destructive ml-1">*</span>}
                </h2>
              </div>

              {renderControl(currentField, scheduleAutoAdvance)}

              {errors[currentField.id] && (
                <p className="text-sm text-destructive">{errors[currentField.id]}</p>
              )}
            </div>

            {/* CAPTCHA + erro de envio: só na última etapa */}
            {showLastStepExtras && captchaEnabled && captchaSiteKey && captchaProvider && (
              <div className="space-y-2 mt-6">
                <Captcha
                  provider={captchaProvider}
                  siteKey={captchaSiteKey}
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                  theme="light"
                />
                {errors._captcha && <p className="text-sm text-destructive">{errors._captcha}</p>}
                {captchaError && (
                  <p className="text-sm text-destructive">
                    Erro ao carregar verificação. Por favor, recarregue a página.
                  </p>
                )}
              </div>
            )}

            {showLastStepExtras && errors._form && (
              <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{errors._form}</p>
              </div>
            )}

            {/* Navegação */}
            <div className="flex items-center justify-between gap-3 mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                className={cn(clampedStep === 0 && "invisible")}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                {t("back")}
              </Button>

              {isLastStep ? (
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || (captchaEnabled && !captchaToken)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      {t("submit")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={goNext}>
                  {t("next")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {showEnterHint && (
              <p className="text-xs text-muted-foreground text-center mt-4">{t("enterHint")}</p>
            )}

            <p className="text-center text-sm text-muted-foreground mt-10">
              {t("poweredBy")}{" "}
              <Link href="/" className="text-primary hover:underline">
                {tCommon("appName")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-radial" style={themeStyles}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header - só mostra se branding não estiver escondido */}
        {!hideBranding && (
          <div className="text-center animate-fade-in-up">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold">{tCommon("appName")}</span>
            </Link>
          </div>
        )}

        {/* Form */}
        <Card className="animate-fade-in-up animation-delay-100">
          <CardHeader>
            <CardTitle className="text-2xl">{form.name}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">{form.description}</CardDescription>
            )}
            {visibleFields.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {showShortTime
                    ? t("estimatedTimeShort")
                    : t("estimatedTime").replace("{minutes}", String(estimatedMinutes))}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} onBlur={() => void savePartial()} className="space-y-6">
              {visibleFields.map((field, index) => renderFieldBlock(field, index))}

              {/* CAPTCHA */}
              {captchaEnabled && captchaSiteKey && captchaProvider && (
                <div className="space-y-2 animate-fade-in-up">
                  <Captcha
                    provider={captchaProvider}
                    siteKey={captchaSiteKey}
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    onExpire={handleCaptchaExpire}
                    theme="light"
                  />
                  {errors._captcha && <p className="text-sm text-destructive">{errors._captcha}</p>}
                  {captchaError && (
                    <p className="text-sm text-destructive">
                      Erro ao carregar verificação. Por favor, recarregue a página.
                    </p>
                  )}
                </div>
              )}

              {errors._form && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{errors._form}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || (captchaEnabled && !captchaToken)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    {t("submit")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer - sempre visível */}
        <p className="text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-200">
          {t("poweredBy")}{" "}
          <Link href="/" className="text-primary hover:underline">
            {tCommon("appName")}
          </Link>
        </p>
      </div>
    </div>
  );
}
