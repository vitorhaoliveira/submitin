"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@submitin/ui/components/badge";
import { Button } from "@submitin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { Input } from "@submitin/ui/components/input";
import { Label } from "@submitin/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@submitin/ui/components/select";
import { Separator } from "@submitin/ui/components/separator";
import { Switch } from "@submitin/ui/components/switch";
import { Textarea } from "@submitin/ui/components/textarea";
import { ThemeEditor } from "@/components/theme-editor";
import { UnsavedBar } from "./unsaved-bar";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n-context";
import type { CustomTheme } from "@/lib/theme-utils";

export type DocumentFormSettings = {
  description: string;
  conversational: boolean;
  thankYouTitle: string;
  thankYouMessage: string;
  thankYouRedirectUrl: string;
  hideBranding: boolean;
  customTheme: CustomTheme | null;
  opensAt: string | null;
  closesAt: string | null;
  maxResponses: number | null;
  closedMessage: string;
  captchaEnabled: boolean;
  captchaProvider: "turnstile" | "hcaptcha" | null;
  captchaSiteKey: string;
  captchaSecretKey: string;
};

/** ISO → valor de <input type="datetime-local"> no fuso do navegador. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function Section({
  title,
  desc,
  plan,
  locked,
  lockedText,
  seePlans,
  children,
}: {
  title: string;
  desc?: string;
  plan?: string;
  locked?: boolean;
  lockedText?: string;
  seePlans?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {plan && (
          <Badge variant="secondary" className="text-[11px]">
            {plan}
          </Badge>
        )}
      </div>
      {desc && <p className="-mt-1.5 text-sm text-muted-foreground">{desc}</p>}
      {locked && lockedText && (
        <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {lockedText}{" "}
            <Link href="/dashboard/billing" className="font-medium text-foreground underline underline-offset-2">
              {seePlans}
            </Link>
          </span>
        </p>
      )}
      <fieldset disabled={locked} className="space-y-3 disabled:opacity-60">
        {children}
      </fieldset>
    </section>
  );
}

/** Aparência e comportamento do formulário que o cliente preenche. */
export function FormSettingsCard({
  documentId,
  initial,
  plan,
  publicUrl,
}: {
  documentId: string;
  initial: DocumentFormSettings;
  plan: { paid: boolean; top: boolean };
  publicUrl: string;
}) {
  const tDocs = useTranslations("documents");
  const t = (key: string) => tDocs(`detail.formSettings.${key}`);
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const set = <K extends keyof DocumentFormSettings>(key: K, value: DocumentFormSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        description: s.description,
        conversational: s.conversational,
        thankYouTitle: s.thankYouTitle,
        thankYouMessage: s.thankYouMessage,
        thankYouRedirectUrl: s.thankYouRedirectUrl,
      };
      if (plan.paid) Object.assign(body, { hideBranding: s.hideBranding, customTheme: s.customTheme });
      if (plan.top) {
        Object.assign(body, {
          opensAt: s.opensAt,
          closesAt: s.closesAt,
          maxResponses: s.maxResponses,
          closedMessage: s.closedMessage,
          captchaEnabled: s.captchaEnabled,
          captchaProvider: s.captchaProvider,
          captchaSiteKey: s.captchaSiteKey,
          captchaSecretKey: s.captchaSecretKey,
        });
      }
      const res = await fetch(`/api/documents/${documentId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setSaved(s);
      toast({ title: t("saved") });
    } catch (err) {
      toast({
        title: err instanceof Error && err.message ? err.message : t("error"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("desc")}</CardDescription>
        </div>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" type="button">
            {t("open")}
          </Button>
        </a>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title={t("intro")} desc={t("introDesc")}>
          <Textarea
            id="doc-form-description"
            rows={2}
            maxLength={500}
            value={s.description}
            placeholder={t("introPlaceholder")}
            onChange={(e) => set("description", e.target.value)}
          />
        </Section>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="doc-form-conversational" className="text-sm font-semibold">
              {t("conversational")}
            </Label>
            <p className="text-sm text-muted-foreground">{t("conversationalDesc")}</p>
          </div>
          <Switch
            id="doc-form-conversational"
            checked={s.conversational}
            onCheckedChange={(v: boolean) => set("conversational", v)}
          />
        </div>

        <Separator />

        <Section title={t("thankYou")} desc={t("thankYouDesc")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-form-ty-title">{t("thankYouTitle")}</Label>
              <Input
                id="doc-form-ty-title"
                maxLength={100}
                value={s.thankYouTitle}
                placeholder={t("thankYouTitlePlaceholder")}
                onChange={(e) => set("thankYouTitle", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-form-ty-url">{t("redirect")}</Label>
              <Input
                id="doc-form-ty-url"
                type="url"
                value={s.thankYouRedirectUrl}
                placeholder="https://"
                onChange={(e) => set("thankYouRedirectUrl", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-form-ty-message">{t("thankYouMessage")}</Label>
            <Textarea
              id="doc-form-ty-message"
              rows={2}
              maxLength={500}
              value={s.thankYouMessage}
              placeholder={t("thankYouMessagePlaceholder")}
              onChange={(e) => set("thankYouMessage", e.target.value)}
            />
          </div>
        </Section>

        <Separator />

        <Section title={t("appearance")} plan="Pro" locked={!plan.paid} lockedText={t("lockedPro")} seePlans={t("seePlans")}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="doc-form-hide-branding">{t("hideBranding")}</Label>
              <p className="text-sm text-muted-foreground">{t("hideBrandingDesc")}</p>
            </div>
            <Switch
              id="doc-form-hide-branding"
              checked={s.hideBranding}
              disabled={!plan.paid}
              onCheckedChange={(v: boolean) => set("hideBranding", v)}
            />
          </div>
          <ThemeEditor
            theme={s.customTheme}
            onChange={(theme) => set("customTheme", theme)}
            isPro={plan.paid}
            disabled={!plan.paid}
          />
        </Section>

        <Separator />

        <Section title={t("schedule")} desc={t("scheduleDesc")} plan="Ilimitado" locked={!plan.top} lockedText={t("lockedTop")} seePlans={t("seePlans")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc-form-opens">{t("opensAt")}</Label>
              <Input
                id="doc-form-opens"
                type="datetime-local"
                value={toLocalInput(s.opensAt)}
                onChange={(e) => set("opensAt", fromLocalInput(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-form-closes">{t("closesAt")}</Label>
              <Input
                id="doc-form-closes"
                type="datetime-local"
                value={toLocalInput(s.closesAt)}
                onChange={(e) => set("closesAt", fromLocalInput(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-form-max">{t("maxResponses")}</Label>
              <Input
                id="doc-form-max"
                type="number"
                min={1}
                value={s.maxResponses ?? ""}
                placeholder={t("noLimit")}
                onChange={(e) => set("maxResponses", e.target.value ? Number.parseInt(e.target.value, 10) : null)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-form-closed-message">{t("closedMessage")}</Label>
            <Input
              id="doc-form-closed-message"
              maxLength={500}
              value={s.closedMessage}
              placeholder={t("closedMessagePlaceholder")}
              onChange={(e) => set("closedMessage", e.target.value)}
            />
          </div>
        </Section>

        <Separator />

        <Section title={t("captcha")} desc={t("captchaDesc")} plan="Ilimitado" locked={!plan.top} lockedText={t("lockedTop")} seePlans={t("seePlans")}>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="doc-form-captcha">{t("captchaEnable")}</Label>
            <Switch
              id="doc-form-captcha"
              checked={s.captchaEnabled}
              disabled={!plan.top}
              onCheckedChange={(v: boolean) => set("captchaEnabled", v)}
            />
          </div>
          {s.captchaEnabled && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{t("captchaProvider")}</Label>
                <Select
                  value={s.captchaProvider ?? ""}
                  onValueChange={(v: string) => set("captchaProvider", v as "turnstile" | "hcaptcha")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("captchaProviderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
                    <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-form-captcha-site">{t("captchaSiteKey")}</Label>
                <Input
                  id="doc-form-captcha-site"
                  value={s.captchaSiteKey}
                  onChange={(e) => set("captchaSiteKey", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-form-captcha-secret">{t("captchaSecretKey")}</Label>
                <Input
                  id="doc-form-captcha-secret"
                  type="password"
                  autoComplete="off"
                  value={s.captchaSecretKey}
                  onChange={(e) => set("captchaSecretKey", e.target.value)}
                />
              </div>
            </div>
          )}
        </Section>

        <UnsavedBar
          dirty={dirty}
          saving={saving}
          onSave={save}
          onDiscard={() => setS(saved)}
          saveLabel={t("save")}
        />
      </CardContent>
    </Card>
  );
}
