import { isoDateInBrazil } from "@submitin/documents/format";

/**
 * Natureza de cada campo (ver Field.nature no schema):
 * pergunta · fixa · pre_preenchida · automatica.
 * Formulários comuns têm tudo como "pergunta".
 */
export type NatureField = {
  id: string;
  nature?: string | null;
  defaultValue?: string | null;
  variableKey?: string | null;
};

/** Resolve variáveis automáticas conhecidas. Retorna null se não houver resolvedor. */
export function resolveAutomatic(key: string | null | undefined, now: Date): string | null {
  switch (key) {
    case "data_assinatura":
      return isoDateInBrazil(now); // "aaaa-mm-dd", formatado na geração
    default:
      return null;
  }
}

/**
 * Separa o que o respondente responde do que já vem definido:
 * - locked: valores que não vêm do respondente (fixa, automática, pré-preenchida pelo link)
 * - askedIds: campos exibidos no formulário (pergunta + pré-preenchida sem valor no link)
 */
export function resolveNatures(
  fields: NatureField[],
  inviteValues: Record<string, string> = {},
  now: Date = new Date()
): { locked: Record<string, string>; askedIds: Set<string>; fromInvite: Set<string> } {
  const locked: Record<string, string> = {};
  const askedIds = new Set<string>();
  const fromInvite = new Set<string>();

  for (const field of fields) {
    switch (field.nature) {
      case "fixa": {
        const value = field.defaultValue?.trim();
        if (value) locked[field.id] = value;
        break;
      }
      case "automatica": {
        const value = resolveAutomatic(field.variableKey, now);
        if (value) locked[field.id] = value;
        else askedIds.add(field.id); // sem resolvedor: melhor perguntar do que sair em branco
        break;
      }
      case "pre_preenchida": {
        const value = inviteValues[field.id]?.trim();
        if (value) {
          locked[field.id] = value;
          fromInvite.add(field.id);
        } else {
          askedIds.add(field.id);
        }
        break;
      }
      default:
        askedIds.add(field.id);
    }
  }
  return { locked, askedIds, fromInvite };
}
