"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Palette, Trash2 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n-context";
import { BrandHeader } from "@/components/brand-header";

const ACCEPT = "image/png,image/jpeg,image/webp";

/** Marca da conta: logo + nome no topo dos formulários e no e-mail ao cliente. */
export function BrandCard({ brand }: { brand: { name: string | null; logoUrl: string | null } }) {
  const tAccount = useTranslations("account");
  const t = (key: string) => tAccount(`brand.${key}`);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(brand.name ?? "");
  const [saved, setSaved] = useState(brand);
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  const logoUrl = localUrl ?? (removeLogo ? null : saved.logoUrl);
  const dirty = name.trim() !== (saved.name ?? "") || Boolean(file) || removeLogo;

  function pick(next: File | undefined) {
    if (!next) return;
    if (next.size > 1024 * 1024) {
      toast({ title: t("tooLarge"), variant: "destructive" });
      return;
    }
    if (localUrl) URL.revokeObjectURL(localUrl);
    setFile(next);
    setLocalUrl(URL.createObjectURL(next));
    setRemoveLogo(false);
  }

  function clearLogo() {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setFile(null);
    setLocalUrl(null);
    setRemoveLogo(Boolean(saved.logoUrl));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function save() {
    setSaving(true);
    try {
      const body = new FormData();
      body.set("name", name.trim());
      if (file) body.set("logo", file);
      if (removeLogo) body.set("removeLogo", "1");
      const res = await fetch("/api/user/branding", { method: "PUT", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved({ name: data.name, logoUrl: data.logoUrl });
      setFile(null);
      if (localUrl) URL.revokeObjectURL(localUrl);
      setLocalUrl(null);
      setRemoveLogo(false);
      toast({ title: t("saved") });
    } catch (err) {
      toast({ title: err instanceof Error && err.message ? err.message : t("error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="marca" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1fr_minmax(0,18rem)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>{t("logo")}</Label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/40 text-muted-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("upload")}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
              </button>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    {logoUrl ? t("replace") : t("upload")}
                  </Button>
                  {logoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearLogo}>
                      <Trash2 className="w-4 h-4" />
                      {t("remove")}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
              </div>
              <input
                ref={inputRef}
                id="brand-logo"
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-name">{t("name")}</Label>
            <Input
              id="brand-name"
              value={name}
              maxLength={80}
              placeholder={t("namePlaceholder")}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button type="button" onClick={save} disabled={!dirty || saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("save")}
          </Button>
        </div>

        {/* Como o cliente vê */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("previewLabel")}</p>
          <div className="rounded-xl border bg-muted/30 p-5">
            {logoUrl || name.trim() ? (
              <BrandHeader name={name.trim() || null} logoUrl={logoUrl} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("previewEmpty")}</p>
            )}
            <div className="mt-4 space-y-2" aria-hidden>
              <div className="h-2.5 w-2/3 rounded-full bg-muted" />
              <div className="h-8 rounded-lg border bg-background" />
              <div className="h-8 rounded-lg border bg-background" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
