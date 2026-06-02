import { Crown } from "lucide-react";

export function FeatureCard({
  icon,
  title,
  description,
  delay = "100",
  isPro = false,
  accent = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
  isPro?: boolean;
  accent?: "primary" | "amber";
}) {
  const iconClass = isPro
    ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600"
    : accent === "amber"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-primary/10 text-primary";
  const hoverBorder =
    isPro
      ? "border-2 border-yellow-500/20 hover:border-yellow-500/40"
      : accent === "amber"
        ? "hover:border-amber-500/40"
        : "hover:border-primary/40";
  return (
    <div
      className={`group glass rounded-xl p-6 text-left transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-${delay} ${hoverBorder}`}
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${iconClass}`}
      >
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {isPro && <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
