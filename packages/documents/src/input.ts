/**
 * Máscaras progressivas para inputs do formulário público (client-safe, sem dependências).
 */
import { isValidCnpj, isValidCpf, onlyDigits } from "./validation";

function applyMask(digits: string, pattern: string): string {
  let i = 0;
  let out = "";
  for (const ch of pattern) {
    if (i >= digits.length) break;
    if (ch === "0") out += digits[i++];
    else out += ch;
  }
  return out;
}

export const INPUT_MASKS: Record<string, { pattern: string; maxDigits: number }> = {
  cpf: { pattern: "000.000.000-00", maxDigits: 11 },
  cnpj: { pattern: "00.000.000/0000-00", maxDigits: 14 },
  cep: { pattern: "00000-000", maxDigits: 8 },
};

export function maskInput(type: string, value: string): string {
  if (type === "currency") return maskCurrencyInput(value);
  const mask = INPUT_MASKS[type];
  if (!mask) return value;
  return applyMask(onlyDigits(value).slice(0, mask.maxDigits), mask.pattern);
}

/** Digitação em centavos: "123456" → "1.234,56". */
export function maskCurrencyInput(value: string): string {
  const digits = onlyDigits(value).replace(/^0+(?=\d)/, "").slice(0, 12);
  if (!digits) return "";
  const cents = Number(digits);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type MaskedFieldError = "invalidCpf" | "invalidCnpj" | "invalidCep" | null;

/** Validação dos tipos brasileiros; null = válido (ou vazio). */
export function validateMaskedField(type: string, value: string): MaskedFieldError {
  if (!value.trim()) return null;
  if (type === "cpf") return isValidCpf(value) ? null : "invalidCpf";
  if (type === "cnpj") return isValidCnpj(value) ? null : "invalidCnpj";
  if (type === "cep") return onlyDigits(value).length === 8 ? null : "invalidCep";
  return null;
}
