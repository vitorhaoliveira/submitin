import { getTranslations } from "@/lib/i18n";
import { Card, CardContent } from "@submitin/ui/components/card";
import { ComparisonRow } from "./comparison-row";

export async function ComparisonSection() {
  const t = await getTranslations("landing");

  return (
    <section className="bg-muted/30">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("comparison.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("comparison.subtitle")}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">{t("comparison.features")}</th>
                    <th className="text-center p-4 font-semibold">{t("comparison.free")}</th>
                    <th className="text-center p-4 font-semibold bg-yellow-500/10">
                      {t("comparison.pro")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    feature={t("comparison.forms")}
                    free={t("comparison.formsLimit")}
                    pro={t("comparison.formsUnlimited")}
                  />
                  <ComparisonRow
                    feature={t("comparison.responsesPerMonth")}
                    free={t("comparison.responsesLimit")}
                    pro={t("comparison.responsesUnlimited")}
                  />
                  <ComparisonRow feature={t("comparison.emailNotifications")} free pro />
                  <ComparisonRow feature={t("comparison.webhooks")} free pro />
                  <ComparisonRow feature={t("comparison.customTheme")} free={false} pro />
                  <ComparisonRow feature={t("comparison.removeBranding")} free={false} pro />
                  <ComparisonRow feature={t("comparison.captcha")} free={false} pro />
                  <ComparisonRow
                    feature={t("comparison.support")}
                    free={t("comparison.supportCommunity")}
                    pro={t("comparison.supportPriority")}
                  />
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
