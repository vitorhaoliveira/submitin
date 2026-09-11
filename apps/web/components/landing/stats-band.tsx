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
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-xl border bg-border max-w-4xl mx-auto">
        {stats.map((s) => (
          <div key={s.label} className="bg-background p-6 text-center">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
