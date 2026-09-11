import { Crown } from "lucide-react";

export function FeatureCard({
  icon,
  title,
  description,
  isPro = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
  isPro?: boolean;
  accent?: "primary" | "amber";
}) {
  return (
    <div className="bg-background p-6 text-left">
      <div className="w-10 h-10 rounded-md bg-brand-soft text-brand flex items-center justify-center mb-5 [&_svg]:w-5 [&_svg]:h-5">
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="font-semibold">{title}</h3>
        {isPro && <Crown className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
