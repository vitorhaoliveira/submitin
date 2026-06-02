import { getTranslations } from "@/lib/i18n";

export async function StatsBand() {
  const t = await getTranslations("landing");

  const stats = [
    { value: "9", label: t("stats.fieldTypes") },
    { value: "5", label: t("stats.templates") },
    { value: "~2 min", label: t("stats.toPublish") },
    { value: "0", label: t("stats.code") },
  ];

  return (
    <section className="border-y border-border bg-muted/20">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
