import Link from "next/link";
import { getTranslations, getLocaleFromCookie } from "@/lib/i18n";
import { getFormTemplates } from "@/lib/form-templates";
import { Button } from "@submitin/ui/components/button";
import {
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
  ArrowRight,
  Plus,
  FileText,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
};

export async function TemplatesGallery() {
  const t = await getTranslations("landing");
  const locale = await getLocaleFromCookie();
  const templates = getFormTemplates(locale === "en" ? "en" : "pt");

  return (
    <section id="templates" className="container mx-auto px-4 py-24">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm mb-4">
          <FileText className="w-4 h-4" />
          {t("templates.badge")}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{t("templates.title")}</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("templates.subtitle")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {templates.map((tpl) => {
          const Icon = ICONS[tpl.icon] ?? FileText;
          const chips = tpl.fields.slice(0, 4);
          const extra = tpl.fields.length - chips.length;
          return (
            <Link
              key={tpl.id}
              href={`/dashboard/forms/new?template=${tpl.id}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {tpl.fields.length} {t("templates.fields")}
                </span>
              </div>

              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {tpl.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{tpl.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {chips.map((f, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {f.label}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    +{extra}
                  </span>
                )}
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("templates.useTemplate")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}

        {/* Card "começar do zero" */}
        <Link
          href="/dashboard/forms/new"
          className="group flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-muted/30 p-5 transition-all hover:border-primary/50 hover:bg-muted/50"
        >
          <div className="w-11 h-11 rounded-lg bg-background border border-border flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">{t("templates.blankTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("templates.blankDescription")}</p>
        </Link>
      </div>

      <div className="text-center mt-10">
        <Button size="lg" asChild>
          <Link href="/dashboard/forms/new">
            {t("templates.cta")}
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
