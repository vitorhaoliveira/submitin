import { getTranslations } from "@/lib/i18n";
import {
  MessageSquare,
  CalendarDays,
  Star,
  ShoppingBag,
  ListChecks,
  Sparkles,
} from "lucide-react";

const ICONS = [MessageSquare, CalendarDays, Star, ShoppingBag, ListChecks, Sparkles] as const;

export async function UseCases() {
  const t = await getTranslations("landing");

  const items = ICONS.map((Icon, i) => ({
    title: t(`useCases.items.${i}.title`),
    description: t(`useCases.items.${i}.description`),
    Icon,
  }));

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("useCases.title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("useCases.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {items.map((item, i) => {
          const { Icon } = item;
          return (
            <div
              key={i}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card/50 p-5 transition-all hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
