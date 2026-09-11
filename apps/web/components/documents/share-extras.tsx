"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, ChevronDown, Code2, Copy, Download } from "lucide-react";
import { Button } from "@submitin/ui/components/button";
import { Textarea } from "@submitin/ui/components/textarea";
import { cn } from "@submitin/ui/lib/utils";
import { useTranslations } from "@/lib/i18n-context";

const HEIGHTS = { small: "400px", medium: "600px", large: "800px" } as const;
type Size = keyof typeof HEIGHTS;

/** Código de incorporação (iframe) e QR code do link público do documento. */
export function ShareExtras({ url, slug }: { url: string; slug: string }) {
  const tDocs = useTranslations("documents");
  const t = (key: string) => tDocs(`detail.share.${key}`);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size>("medium");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const embed = `<iframe src="${url}" width="100%" height="${HEIGHTS[size]}" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;

  async function copyEmbed() {
    await navigator.clipboard.writeText(embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `submitin-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium hover:bg-muted/40"
      >
        <span className="inline-flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          {t("toggle")}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-5 border-t p-4 sm:grid-cols-[auto_1fr]">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("qr")}</p>
            <div ref={qrRef} className="inline-block rounded-lg border bg-white p-3">
              <QRCodeCanvas value={url} size={148} marginSize={0} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={downloadQr} className="flex gap-1.5">
              <Download className="h-4 w-4" />
              {t("qrDownload")}
            </Button>
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium">{t("embed")}</p>
            <p className="text-xs text-muted-foreground">{t("embedDesc")}</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(HEIGHTS) as Size[]).map((key) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={size === key ? "default" : "outline"}
                  onClick={() => setSize(key)}
                >
                  {t(`size.${key}`)}
                </Button>
              ))}
            </div>
            <Textarea readOnly rows={3} value={embed} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
            <Button type="button" variant="outline" size="sm" onClick={copyEmbed} className="gap-1.5">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
