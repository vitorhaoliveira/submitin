import { getTranslations } from "@/lib/i18n";
import { Crown, Palette, Shield, Zap, Mail, BarChart3 } from "lucide-react";
import { FeatureCard } from "./feature-card";

export async function ProFeaturesSection() {
  const t = await getTranslations("landing");

  const features = [
    { icon: <Palette className="w-6 h-6" />, key: "customTheme", delay: "100" },
    { icon: <Shield className="w-6 h-6" />, key: "captcha", delay: "150" },
    { icon: <Zap className="w-6 h-6" />, key: "unlimitedResponses", delay: "200" },
    { icon: <Crown className="w-6 h-6" />, key: "removeBranding", delay: "250" },
    { icon: <Mail className="w-6 h-6" />, key: "prioritySupport", delay: "300" },
    { icon: <BarChart3 className="w-6 h-6" />, key: "advancedAnalytics", delay: "350" },
  ];

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-sm mb-4">
          <Crown className="w-4 h-4" />
          {t("proFeatures.badge")}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("proFeatures.title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("proFeatures.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((f) => (
          <FeatureCard
            key={f.key}
            icon={f.icon}
            title={t(`proFeatures.${f.key}.title`)}
            description={t(`proFeatures.${f.key}.description`)}
            delay={f.delay}
            isPro
          />
        ))}
      </div>
    </section>
  );
}
