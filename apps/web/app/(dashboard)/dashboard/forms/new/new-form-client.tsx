"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import { Textarea } from "@submitin/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@submitin/ui/components/card";
import {
  ArrowLeft,
  Loader2,
  Plus,
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
  FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createFormSchema, type CreateFormInput } from "@/lib/validations";
import { getFormTemplates, type FormTemplate } from "@/lib/form-templates";

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
};

export function NewFormClient() {
  const router = useRouter();
  const t = useTranslations("newForm");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const templates = getFormTemplates(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);
  const busy = isLoading || creatingTemplate !== null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormInput>({
    resolver: zodResolver(createFormSchema),
  });

  async function createForm(data: CreateFormInput): Promise<{ id: string }> {
    const response = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error();
    return response.json();
  }

  async function onSubmit(data: CreateFormInput) {
    setIsLoading(true);
    try {
      const form = await createForm(data);
      toast({ title: tCommon("success") });
      router.push(`/dashboard/forms/${form.id}`);
    } catch {
      toast({
        title: tCommon("error"),
        description: t("createError"),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  async function createFromTemplate(tpl: FormTemplate) {
    if (busy) return;
    setCreatingTemplate(tpl.id);
    try {
      const form = await createForm({ name: tpl.name, description: tpl.description });
      // Cria os campos do modelo em ordem
      for (const field of tpl.fields) {
        await fetch(`/api/forms/${form.id}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required ?? false,
            options: field.options,
          }),
        });
      }
      toast({ title: tCommon("success") });
      router.push(`/dashboard/forms/${form.id}`);
    } catch {
      toast({
        title: tCommon("error"),
        description: t("createError"),
        variant: "destructive",
      });
      setCreatingTemplate(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Templates */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t("templatesTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("templatesSubtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const Icon = TEMPLATE_ICONS[tpl.icon] ?? FileText;
            const isCreating = creatingTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => createFromTemplate(tpl)}
                disabled={busy}
                className="group text-left rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tpl.fields.length} {t("fieldsCount")}
                  </span>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-sm text-muted-foreground">{tpl.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Blank form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-primary" />
            {t("blankTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("blankDescription")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("nameLabel")} *</Label>
              <Input
                id="name"
                placeholder={t("namePlaceholder")}
                {...register("name")}
                disabled={busy}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("descLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("descPlaceholder")}
                {...register("description")}
                disabled={busy}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/forms">
                <Button type="button" variant="outline" disabled={busy}>
                  {tCommon("cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={busy}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("creating")}
                  </>
                ) : (
                  t("create")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
