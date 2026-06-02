/**
 * Lógica condicional (PRO): controla a exibição de um campo conforme a resposta
 * de outro campo. Compartilhado entre o builder, o formulário público e o
 * servidor (validação de respostas).
 */

export type VisibilityOperator = "equals" | "not_equals";

export interface VisibilityRule {
  /** id do campo controlador */
  fieldId: string;
  operator: VisibilityOperator;
  /** valor comparado (string; checkbox usa "true"/"false") */
  value: string;
}

/** Campo mínimo necessário para resolver visibilidade. */
export interface VisibilityField {
  id: string;
  visibility?: VisibilityRule | null;
}

/** Type guard: valida o formato de uma regra vinda do banco (Json). */
export function isVisibilityRule(value: unknown): value is VisibilityRule {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.fieldId === "string" &&
    r.fieldId.length > 0 &&
    (r.operator === "equals" || r.operator === "not_equals") &&
    typeof r.value === "string"
  );
}

/**
 * Uma regra só está "completa" se tem um valor de comparação. Regra com valor
 * vazio é considerada incompleta e ignorada (o campo fica sempre visível) —
 * evita a armadilha de "mostrar se Nome = (vazio)", que some ao digitar.
 */
export function isCompleteRule(rule: VisibilityRule | null | undefined): rule is VisibilityRule {
  return !!rule && rule.value.trim().length > 0;
}

/**
 * Normaliza um valor (Json) para uma regra COMPLETA ou null. Regras
 * incompletas (sem valor) viram null para não afetarem a visibilidade.
 */
export function parseVisibility(value: unknown): VisibilityRule | null {
  if (!isVisibilityRule(value)) return null;
  return isCompleteRule(value) ? value : null;
}

/**
 * Calcula quais campos estão visíveis dados os valores atuais.
 *
 * Resolve em cadeia: se o campo controlador estiver oculto, o dependente
 * também fica oculto (um campo só aparece se toda a sua cadeia aparece).
 * Tolerante a ciclos/refs inválidas: o resultado converge em N iterações.
 *
 * @returns Set com os ids dos campos visíveis.
 */
export function computeVisibleFieldIds(
  fields: VisibilityField[],
  values: Record<string, string>
): Set<string> {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const visible = new Set<string>();

  // Estado inicial: campos sem regra são visíveis.
  for (const f of fields) {
    if (!parseVisibility(f.visibility)) visible.add(f.id);
  }

  // Itera até estabilizar (no máximo uma passada por campo).
  for (let pass = 0; pass < fields.length + 1; pass++) {
    let changed = false;
    for (const f of fields) {
      const rule = parseVisibility(f.visibility);
      if (!rule) continue;

      const controller = byId.get(rule.fieldId);
      // Regra aponta para campo inexistente → mantém visível (fail-open).
      const controllerVisible = !controller || visible.has(rule.fieldId);
      const controllerValue = controllerVisible ? values[rule.fieldId] ?? "" : "";

      const matches =
        rule.operator === "equals"
          ? controllerValue === rule.value
          : controllerValue !== rule.value;

      const shouldShow = controllerVisible && matches;
      if (shouldShow && !visible.has(f.id)) {
        visible.add(f.id);
        changed = true;
      } else if (!shouldShow && visible.has(f.id)) {
        visible.delete(f.id);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return visible;
}

/** Conveniência: um único campo está visível? */
export function isFieldVisible(
  field: VisibilityField,
  fields: VisibilityField[],
  values: Record<string, string>
): boolean {
  return computeVisibleFieldIds(fields, values).has(field.id);
}
