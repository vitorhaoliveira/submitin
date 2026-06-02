"use client";

import { useTranslations } from "@/lib/i18n-context";
import { Card, CardContent, CardHeader, CardTitle } from "@submitin/ui/components/card";
import { BarChart3 } from "lucide-react";

interface Field {
  id: string;
  label: string;
  type: string;
}

interface FieldValue {
  value: string;
  field: { id: string };
}

interface Response {
  submittedAt: Date | string;
  fieldValues: FieldValue[];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Agrupa respostas por dia (local), retornando os últimos até 30 dias com contagem. */
function getByDay(responses: Response[]) {
  const map = new Map<string, { label: string; count: number }>();
  for (const r of responses) {
    const d = new Date(r.submittedAt);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { label, count: 1 });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([, v]) => v);
}

/** Distribuição de valores de um campo select/rating. */
function getDistribution(field: Field, responses: Response[]) {
  const counts = new Map<string, number>();
  if (field.type === "rating") {
    for (const v of ["5", "4", "3", "2", "1"]) counts.set(v, 0);
  }
  let answered = 0;
  for (const r of responses) {
    const fv = r.fieldValues.find((x) => x.field.id === field.id);
    const value = fv?.value?.trim();
    if (!value) continue;
    answered += 1;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  const rows = Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
    percentage: answered > 0 ? (count / answered) * 100 : 0,
  }));
  // rating mantém ordem 5→1; select ordena por contagem desc
  if (field.type !== "rating") rows.sort((a, b) => b.count - a.count);
  return { rows, answered };
}

export function ResponseCharts({
  fields,
  responses,
}: {
  fields: Field[];
  responses: Response[];
}) {
  const t = useTranslations("responses");
  if (responses.length === 0) return null;

  const byDay = getByDay(responses);
  const maxDay = Math.max(...byDay.map((d) => d.count), 1);
  const distributionFields = fields.filter(
    (f) => f.type === "select" || f.type === "rating"
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Respostas por dia */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-primary" />
            {t("charts.byDay")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 h-40">
            {byDay.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                <span className="text-[10px] text-muted-foreground tabular-nums">{d.count}</span>
                <div
                  className="w-full max-w-[28px] rounded-t bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${Math.max(6, (d.count / maxDay) * 120)}px` }}
                  title={`${d.label}: ${d.count}`}
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por campo (select/rating) */}
      {distributionFields.map((field) => {
        const { rows } = getDistribution(field, responses);
        return (
          <Card key={field.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base truncate">
                {field.type === "rating" ? "★ " : ""}
                {field.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">
                      {field.type === "rating" ? `${row.label} ★` : row.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">
                      {row.count} · {row.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("charts.noData")}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
