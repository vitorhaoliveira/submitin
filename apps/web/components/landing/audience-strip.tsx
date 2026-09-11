import { getTranslations } from "@/lib/i18n";

export async function AudienceStrip() {
  const t = await getTranslations("landing");
  const items = [0, 1, 2, 3, 4].map((i) => t(`audience.items.${i}`));

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">{t("audience.title")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
