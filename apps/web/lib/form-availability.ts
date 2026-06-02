/**
 * Agendamento e limites (PRO): determina se um formulário aceita respostas no
 * momento. Compartilhado entre o servidor (bloqueio do envio) e o formulário
 * público (tela de "encerrado").
 */

export type FormAvailabilityReason =
  | "open"
  | "scheduled" // ainda não abriu (antes de opensAt)
  | "closed_date" // passou de closesAt
  | "closed_limit"; // atingiu maxResponses

export interface FormSchedule {
  opensAt?: Date | string | null;
  closesAt?: Date | string | null;
  maxResponses?: number | null;
  closedMessage?: string | null;
}

export interface FormAvailability {
  isOpen: boolean;
  reason: FormAvailabilityReason;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Avalia a disponibilidade do formulário.
 * @param schedule  configuração de agendamento (de FormSettings)
 * @param responseCount  total de respostas já recebidas
 * @param now  data de referência (default: agora) — injetável para testes/SSR
 */
export function getFormAvailability(
  schedule: FormSchedule | null | undefined,
  responseCount: number,
  now: Date = new Date()
): FormAvailability {
  if (!schedule) return { isOpen: true, reason: "open" };

  const opensAt = toDate(schedule.opensAt);
  const closesAt = toDate(schedule.closesAt);

  // Ainda não abriu
  if (opensAt && now < opensAt) {
    return { isOpen: false, reason: "scheduled" };
  }

  // Já fechou por data
  if (closesAt && now > closesAt) {
    return { isOpen: false, reason: "closed_date" };
  }

  // Atingiu o limite de respostas
  if (
    typeof schedule.maxResponses === "number" &&
    schedule.maxResponses > 0 &&
    responseCount >= schedule.maxResponses
  ) {
    return { isOpen: false, reason: "closed_limit" };
  }

  return { isOpen: true, reason: "open" };
}
