import { getTranslations } from "@/lib/i18n";
import { FilePlus2, Share2, Inbox } from "lucide-react";

const ICONS = [FilePlus2, Share2, Inbox] as const;

export async function HowItWorks() {
  const t = await getTranslations("landing");
  const steps = ICONS.map((Icon, i) => ({
    title: t(`howItWorks.steps.${i}.title`),
    description: t(`howItWorks.steps.${i}.description`),
    Icon,
  }));

  return (
    <section id="how" className="container mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">{t("howItWorks.title")}</h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("howItWorks.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-px overflow-hidden rounded-xl border bg-border max-w-5xl mx-auto">
        {steps.map((step, i) => {
          const { Icon } = step;
          return (
            <div key={i} className="bg-background p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 rounded-md border flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-muted-foreground tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
