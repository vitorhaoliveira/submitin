import { getTranslations } from "@/lib/i18n";
import { Mail, Code2, Webhook, Lock, Shield, Zap } from "lucide-react";
import { FeatureCard } from "./feature-card";

export async function FeaturesSection() {
  const t = await getTranslations("landing");

  const features = [
    { icon: <Mail className="w-6 h-6" />, key: "email", delay: "100" },
    { icon: <Code2 className="w-6 h-6" />, key: "embed", delay: "150" },
    { icon: <Webhook className="w-6 h-6" />, key: "webhooks", delay: "200" },
    { icon: <Lock className="w-6 h-6" />, key: "secureLogin", delay: "250" },
    { icon: <Shield className="w-6 h-6" />, key: "security", delay: "300" },
    { icon: <Zap className="w-6 h-6" />, key: "performance", delay: "350" },
  ];

  return (
    <section id="features" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          {t("features.sectionTitle")}
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("features.sectionSubtitle")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <FeatureCard
            key={f.key}
            icon={f.icon}
            title={t(`features.${f.key}.title`)}
            description={t(`features.${f.key}.description`)}
            delay={f.delay}
            accent={i % 2 === 1 ? "amber" : "primary"}
          />
        ))}
      </div>
    </section>
  );
}
