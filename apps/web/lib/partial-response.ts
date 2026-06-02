/**
 * Respostas parciais (PRO): captura leads que começaram mas não enviaram o
 * formulário. Uma parcial só é salva quando há um valor de contato (email ou
 * telefone) preenchido — é o que torna o lead útil para recontato.
 */

type ContactField = { id: string; type: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pelo menos 8 dígitos → tratamos como telefone plausível. */
function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
}

/**
 * Há um valor de contato (email válido ou telefone plausível) entre os campos?
 * Considera o tipo do campo (email/phone) e também o conteúdo (um email digitado
 * num campo de texto também conta).
 */
export function hasContactValue(
  fields: ContactField[],
  values: Record<string, string>
): boolean {
  for (const field of fields) {
    const raw = values[field.id];
    if (!raw) continue;
    const value = raw.trim();
    if (!value) continue;

    if (field.type === "email" && EMAIL_RE.test(value)) return true;
    if (field.type === "phone" && looksLikePhone(value)) return true;
    // Conteúdo de contato em campo de texto livre
    if (EMAIL_RE.test(value)) return true;
  }
  return false;
}
