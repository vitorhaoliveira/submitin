import { getTranslations } from "@/lib/i18n";
import { Check } from "lucide-react";

export async function TrustBar() {
  const t = await getTranslations("landing");
  const guarantees = [0, 1, 2, 3].map((i) => t(`trust.guarantees.${i}`));

  return (
    <section className="border-y border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {guarantees.map((g) => (
            <span key={g} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              {g}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
