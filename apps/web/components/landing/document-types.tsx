import { getTranslations } from "@/lib/i18n";
import {
  BadgeCheck,
  Camera,
  ClipboardList,
  FilePen,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { Squiggle } from "./doodles";

const ICONS = [FilePen, ClipboardList, Camera, GraduationCap, BadgeCheck, ShieldCheck];

export async function DocumentTypes() {
  const t = await getTranslations("landing");

  return (
    <section id="documentos" className="container mx-auto px-4 py-20 md:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          {t("docTypes.title")}
        </h2>
        <Squiggle className="mt-2 h-3 w-40 text-pop" />
        <p className="mt-4 text-lg text-muted-foreground">{t("docTypes.subtitle")}</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ICONS.map((Icon, i) => (
          <div
            key={i}
            className="group rounded-2xl border bg-background p-6 transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center transition-transform group-hover:-rotate-6">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-muted-foreground">.docx → .pdf</span>
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">
              {t(`docTypes.items.${i}.title`)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`docTypes.items.${i}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
