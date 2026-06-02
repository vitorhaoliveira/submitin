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
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{t("howItWorks.title")}</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("howItWorks.subtitle")}
        </p>
      </div>

      <div className="relative grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Connector line (desktop) */}
        <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/40 via-amber-400/40 to-amber-400/50" />

        {steps.map((step, i) => {
          const { Icon } = step;
          const amber = i === 1;
          return (
            <div
              key={i}
              className="relative flex flex-col items-center text-center animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div
                className={`relative w-14 h-14 rounded-full bg-card border flex items-center justify-center mb-5 ${
                  amber ? "border-amber-500/40" : "border-primary/30"
                }`}
              >
                <Icon className={`w-6 h-6 ${amber ? "text-amber-500" : "text-primary"}`} />
                <span
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                    amber ? "bg-amber-500" : "bg-primary"
                  }`}
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
