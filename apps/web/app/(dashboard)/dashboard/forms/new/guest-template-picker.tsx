"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@submitin/ui/components/card";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
  FileText,
} from "lucide-react";
import { getFormTemplates } from "@/lib/form-templates";

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
};

/**
 * Seletor de modelos para visitantes (sem login). Igual ao do usuário logado,
 * mas em vez de criar via API cada modelo abre o construtor convidado já
 * preenchido (?template=<id>) — e "em branco" abre o construtor vazio.
 */
export function GuestTemplatePicker() {
  const t = useTranslations("newForm");
  const locale = useLocale();
  const templates = getFormTemplates(locale);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
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
            return (
              <Link
                key={tpl.id}
                href={`/dashboard/forms/new?template=${tpl.id}`}
                className="group text-left rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tpl.fields.length} {t("fieldsCount")}
                  </span>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-sm text-muted-foreground">{tpl.description}</p>
              </Link>
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
          <Link href="/dashboard/forms/new?blank=1">
            <Button>{t("create")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
