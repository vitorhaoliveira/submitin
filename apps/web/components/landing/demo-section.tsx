import { getTranslations } from "@/lib/i18n";
import { ProductDemo } from "./product-demo";

export async function DemoSection() {
  const t = await getTranslations("landing");

  return (
    <section id="demo" className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{t("demo.title")}</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("demo.subtitle")}
        </p>
      </div>
      <ProductDemo />
    </section>
  );
}
