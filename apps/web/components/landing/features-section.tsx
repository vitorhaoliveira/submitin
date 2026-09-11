import { getTranslations } from "@/lib/i18n";
import { BadgeCheck, FileText, Mail, Webhook, WholeWord, LayoutList } from "lucide-react";
import { PaperDoodle, Sparkle } from "./doodles";

/** Recursos em bento (inspirado no Tally): um card de destaque + cards menores. */
export async function FeaturesSection() {
  const t = await getTranslations("landing");

  const small = [
    { key: "cpf", icon: BadgeCheck },
    { key: "words", icon: WholeWord },
    { key: "email", icon: Mail },
    { key: "webhook", icon: Webhook },
    { key: "forms", icon: LayoutList },
  ];

  return (
    <section id="recursos" className="container mx-auto px-4 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          {t("bento.title")}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{t("bento.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
        {/* Destaque: fidelidade ao Word */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-pop/70 bg-background p-7 md:col-span-2 md:row-span-2">
          <Sparkle className="absolute right-6 top-6 w-8 text-pop" />
          <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="mt-5 font-display text-2xl md:text-3xl font-bold">
            {t("bento.fidelity.title")}
          </h3>
          <p className="mt-2 max-w-md text-muted-foreground">{t("bento.fidelity.description")}</p>

          {/* Mini documento lado a lado: Word → PDF */}
          <div className="mt-8 flex items-end gap-4">
            <MiniDoc label=".docx" />
            <PaperDoodle className="mb-10 w-10 shrink-0 text-foreground/40" />
            <MiniDoc label=".pdf" filled />
          </div>
        </div>

        {small.map(({ key, icon: Icon }) => (
          <div key={key} className="rounded-2xl border bg-background p-6">
            <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{t(`bento.${key}.title`)}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {t(`bento.${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniDoc({ label, filled = false }: { label: string; filled?: boolean }) {
  const value = (w: string) =>
    filled ? (
      <span className={`inline-block h-2 rounded bg-brand/70 ${w}`} />
    ) : (
      <span className={`inline-block h-2 rounded border border-dashed border-brand/60 ${w}`} />
    );
  return (
    <div className="flex-1 rounded-lg border bg-background p-3 shadow-sm">
      <div className="flex items-center justify-between border-b pb-2">
        <span className="h-2 w-16 rounded bg-foreground/70" />
        <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-10 rounded bg-muted" />
          {value("w-16")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-14 rounded bg-muted" />
          {value("w-12")}
        </div>
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-5/6 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-1 pt-1">
          <span className="h-5 rounded border" />
          <span className="h-5 rounded border" />
        </div>
      </div>
    </div>
  );
}
