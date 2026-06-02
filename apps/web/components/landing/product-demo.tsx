"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n-context";
import { Button } from "@submitin/ui/components/button";
import {
  GripVertical,
  Type,
  Mail,
  MessageSquare,
  Plus,
  Download,
  CheckCircle,
  FileText,
} from "lucide-react";

type Tab = "builder" | "form" | "responses";

export function ProductDemo() {
  const t = useTranslations("landing");
  const [tab, setTab] = useState<Tab>("builder");

  const tabs: { id: Tab; label: string }[] = [
    { id: "builder", label: t("demo.tabBuilder") },
    { id: "form", label: t("demo.tabForm") },
    { id: "responses", label: t("demo.tabResponses") },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 rounded-lg bg-muted/50 border border-border/60">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Window */}
      <div className="rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border/60 bg-muted/40">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <span className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>

        <div className="p-6 md:p-8 min-h-[380px]">
          {tab === "builder" && <BuilderPanel t={t} />}
          {tab === "form" && <FormPanel t={t} />}
          {tab === "responses" && <ResponsesPanel t={t} />}
        </div>
      </div>
    </div>
  );
}

type T = (key: string) => string;

function BuilderPanel({ t }: { t: T }) {
  const fields = [
    { icon: <Type className="w-4 h-4" />, label: t("demo.form.nameLabel"), required: true },
    { icon: <Mail className="w-4 h-4" />, label: t("demo.form.emailLabel"), required: true },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      label: t("demo.form.messageLabel"),
      required: false,
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold">{t("demo.builder.formName")}</span>
      </div>

      {fields.map((field, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background/50 hover:border-primary/40 transition-colors animate-fade-in-up"
          style={{ animationDelay: `${(i + 1) * 80}ms` }}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {field.icon}
          </div>
          <span className="flex-1 text-sm font-medium">{field.label}</span>
          {field.required && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {t("demo.builder.required")}
            </span>
          )}
        </div>
      ))}

      <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
        <Plus className="w-4 h-4" />
        {t("demo.builder.addField")}
      </button>
    </div>
  );
}

function FormPanel({ t }: { t: T }) {
  return (
    <div className="max-w-md mx-auto animate-fade-in-up">
      <h3 className="text-lg font-bold mb-1">{t("demo.form.title")}</h3>
      <p className="text-sm text-muted-foreground mb-6">{t("demo.form.description")}</p>

      <div className="space-y-4">
        <Mock label={t("demo.form.nameLabel")} placeholder={t("demo.form.namePlaceholder")} />
        <Mock label={t("demo.form.emailLabel")} placeholder={t("demo.form.emailPlaceholder")} />
        <Mock
          label={t("demo.form.messageLabel")}
          placeholder={t("demo.form.messagePlaceholder")}
          tall
        />
        <div className="w-full h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {t("demo.form.submit")}
        </div>
      </div>
    </div>
  );
}

function Mock({
  label,
  placeholder,
  tall = false,
}: {
  label: string;
  placeholder: string;
  tall?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      <div
        className={`w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ${
          tall ? "h-16" : "h-9 flex items-center"
        }`}
      >
        {placeholder}
      </div>
    </div>
  );
}

function ResponsesPanel({ t }: { t: T }) {
  const rows = [0, 1, 2].map((i) => ({
    name: t(`demo.responses.rows.${i}.name`),
    email: t(`demo.responses.rows.${i}.email`),
    date: t(`demo.responses.rows.${i}.date`),
  }));

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{t("demo.responses.title")}</h3>
        <Button variant="outline" size="sm" className="pointer-events-none">
          <Download className="w-4 h-4 mr-2" />
          {t("demo.responses.export")}
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-left">
              <th className="p-3 font-semibold">{t("demo.responses.colName")}</th>
              <th className="p-3 font-semibold">{t("demo.responses.colEmail")}</th>
              <th className="p-3 font-semibold">{t("demo.responses.colDate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/40 last:border-b-0 hover:bg-muted/30 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 text-muted-foreground">{row.email}</td>
                <td className="p-3 text-muted-foreground">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        {t("features.email.title")}
      </p>
    </div>
  );
}
