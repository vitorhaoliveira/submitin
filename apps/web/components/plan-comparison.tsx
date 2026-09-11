import { Check, X } from "lucide-react";
import { PLANS, SOLD_PLANS, type PlanType } from "@/lib/stripe";

export type SoldPlan = (typeof SOLD_PLANS)[number];

function limitLabel(n: number, unlimited = "Ilimitados"): string {
  return n === -1 ? unlimited : n.toLocaleString("pt-BR");
}

function docsLabel(plan: SoldPlan): string {
  return limitLabel(PLANS[plan].limits.documentsPerMonth);
}

// Matriz de comparação detalhada (booleano = ✓/✗, string = valor exibido).
type CellValue = boolean | string;
const COMPARISON: { label: string; values: Record<SoldPlan, CellValue> }[] = [
  {
    label: "Documentos por mês",
    values: { free: docsLabel("free"), pro: docsLabel("pro"), unlimited: docsLabel("unlimited") },
  },
  {
    label: "PDF sem o selo Submitin",
    values: {
      free: PLANS.free.limits.hideBranding,
      pro: PLANS.pro.limits.hideBranding,
      unlimited: PLANS.unlimited.limits.hideBranding,
    },
  },
  { label: "Formulário gerado do seu .docx", values: { free: true, pro: true, unlimited: true } },
  { label: "Cliente revisa o PDF antes de enviar", values: { free: true, pro: true, unlimited: true } },
  { label: "Cópia do PDF por e-mail ao cliente", values: { free: true, pro: true, unlimited: true } },
  { label: "Links com dados já preenchidos", values: { free: true, pro: true, unlimited: true } },
  {
    label: "Aceite eletrônico com registro e verificação",
    values: {
      free: PLANS.free.limits.electronicAcceptance,
      pro: PLANS.pro.limits.electronicAcceptance,
      unlimited: PLANS.unlimited.limits.electronicAcceptance,
    },
  },
  { label: "Sua marca no formulário", values: { free: true, pro: true, unlimited: true } },
  { label: "Entrega por e-mail e webhook", values: { free: true, pro: true, unlimited: true } },
  {
    label: "Tema personalizado",
    values: {
      free: PLANS.free.limits.customTheme,
      pro: PLANS.pro.limits.customTheme,
      unlimited: PLANS.unlimited.limits.customTheme,
    },
  },
  {
    label: "Anti-spam (CAPTCHA)",
    values: {
      free: PLANS.free.limits.captcha,
      pro: PLANS.pro.limits.captcha,
      unlimited: PLANS.unlimited.limits.captcha,
    },
  },
  {
    label: "Formulários avulsos",
    values: {
      free: limitLabel(PLANS.free.limits.maxForms),
      pro: limitLabel(PLANS.pro.limits.maxForms),
      unlimited: limitLabel(PLANS.unlimited.limits.maxForms),
    },
  },
  {
    label: "Respostas por mês (formulários avulsos)",
    values: {
      free: limitLabel(PLANS.free.limits.responsesPerMonth, "Ilimitadas"),
      pro: limitLabel(PLANS.pro.limits.responsesPerMonth, "Ilimitadas"),
      unlimited: limitLabel(PLANS.unlimited.limits.responsesPerMonth, "Ilimitadas"),
    },
  },
  { label: "Suporte", values: { free: "Comunidade", pro: "E-mail", unlimited: "Prioritário" } },
];

function ComparisonCell({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-foreground mx-auto" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export function formatPlanPrice(value: number): string {
  return value === 0 ? "Grátis" : `R$ ${value}`;
}

/** Tabela "Compare os planos" — usada no painel (Plano) e na página pública de preços. */
export function PlanComparisonTable({ currentPlan }: { currentPlan?: PlanType | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 font-semibold">Recurso</th>
            {SOLD_PLANS.map((planKey) => (
              <th
                key={planKey}
                scope="col"
                className={`p-4 text-center font-semibold ${
                  currentPlan === planKey ? "bg-primary/5 text-primary" : ""
                }`}
              >
                {PLANS[planKey].name}
                {currentPlan === planKey && (
                  <span className="block text-[10px] font-normal text-muted-foreground">plano atual</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.label} className="border-b last:border-b-0 hover:bg-muted/40">
              <th scope="row" className="p-4 text-left font-medium">
                {row.label}
              </th>
              {SOLD_PLANS.map((planKey) => (
                <td
                  key={planKey}
                  className={`p-4 text-center ${currentPlan === planKey ? "bg-primary/5" : ""}`}
                >
                  <ComparisonCell value={row.values[planKey]} />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="p-4" />
            {SOLD_PLANS.map((planKey) => (
              <td key={planKey} className="p-4 text-center font-semibold tabular-nums">
                {formatPlanPrice(PLANS[planKey].price)}
                {PLANS[planKey].price > 0 && (
                  <span className="text-xs font-normal text-muted-foreground"> /mês</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
