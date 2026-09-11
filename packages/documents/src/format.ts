import type { DocumentFieldType, DocumentVariable } from "./variables";
import { EXTENSO_SUFFIX } from "./variables";
import { onlyDigits } from "./validation";

/** Aceita "1234.56", "1.234,56", "R$ 1.234,56", "1234". Retorna null se não for número. */
export function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/R\$|\s/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100) / 100;
}

export function formatCurrencyBRL(amount: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    .format(amount)
    .replace(/ /g, " ");
}

/** Aceita "2027-02-01" ou "01/02/2027". Retorna [ano, mês, dia] ou null. */
export function parseDate(value: string): [number, number, number] | null {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return [Number(br[3]), Number(br[2]), Number(br[1])];
  return null;
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-12-15" → "15 de dezembro de 2026" (dia 1 → "1º"). */
export function dateToWords(value: string): string {
  const parsed = parseDate(value);
  if (!parsed) return "";
  const [y, m, d] = parsed;
  if (m < 1 || m > 12) return "";
  return `${d === 1 ? "1º" : d} de ${MONTHS[m - 1]} de ${y}`;
}

/** Data de hoje (ou de `date`) no fuso de Brasília, em "aaaa-mm-dd". */
export function isoDateInBrazil(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "10" / "10,5" / "10.5" → 10.5 */
export function parsePercent(value: string): number | null {
  const n = value.replace("%", "").replace(",", ".").trim();
  return /^-?\d+(\.\d+)?$/.test(n) ? Number(n) : null;
}

/** "2027-02-01" → "01/02/2027". Valores já em dd/mm/aaaa passam direto. */
export function formatDateBR(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : value;
}

function mask(value: string, pattern: string): string {
  const digits = onlyDigits(value);
  let i = 0;
  let out = "";
  for (const ch of pattern) {
    if (i >= digits.length) break;
    out += ch === "0" ? digits[i++] : ch;
  }
  return out;
}

export function formatCpf(value: string): string {
  return onlyDigits(value).length === 11 ? mask(value, "000.000.000-00") : value;
}

export function formatCnpj(value: string): string {
  return onlyDigits(value).length === 14 ? mask(value, "00.000.000/0000-00") : value;
}

export function formatCep(value: string): string {
  return onlyDigits(value).length === 8 ? mask(value, "00000-000") : value;
}

export function formatPhoneBR(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 11) return mask(digits, "(00) 00000-0000");
  if (digits.length === 10) return mask(digits, "(00) 0000-0000");
  return value;
}

export function formatValue(type: DocumentFieldType, value: string): string {
  if (!value) return "";
  switch (type) {
    case "date":
      return formatDateBR(value);
    case "currency": {
      const amount = parseCurrency(value);
      return amount === null ? value : formatCurrencyBRL(amount);
    }
    case "cpf":
      return formatCpf(value);
    case "cnpj":
      return formatCnpj(value);
    case "cep":
      return formatCep(value);
    case "phone":
      return formatPhoneBR(value);
    case "percent": {
      const n = parsePercent(value);
      return n === null ? value : `${String(n).replace(".", ",")}%`;
    }
    case "day": {
      const n = Number.parseInt(value, 10);
      return Number.isFinite(n) ? String(n) : value;
    }
    default:
      return value;
  }
}

// ---------------------------------------------------------------------------
// Valor por extenso (pt-BR)
// ---------------------------------------------------------------------------

const UNITS = [
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
  "seiscentos", "setecentos", "oitocentos", "novecentos",
];

/** 0–999 por extenso. */
function hundredsToWords(n: number): string {
  if (n === 100) return "cem";
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]!);
  if (rest) {
    if (rest < 20) parts.push(UNITS[rest]!);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u ? `${TENS[t]} e ${UNITS[u]}` : TENS[t]!);
    }
  }
  return parts.join(" e ");
}

const SCALES: Array<[singular: string, plural: string]> = [
  ["", ""],
  ["mil", "mil"],
  ["milhão", "milhões"],
  ["bilhão", "bilhões"],
];

/** Inteiro não negativo por extenso: 1234 → "mil duzentos e trinta e quatro". */
export function integerToWords(n: number): string {
  if (n === 0) return UNITS[0]!;
  const groups: number[] = [];
  for (let rest = Math.floor(n); rest > 0; rest = Math.floor(rest / 1000)) groups.push(rest % 1000);

  const chunks: Array<{ text: string; value: number }> = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]!;
    if (!g) continue;
    const [singular, plural] = SCALES[i]!;
    let text: string;
    if (i === 0) text = hundredsToWords(g);
    else if (i === 1) text = g === 1 ? "mil" : `${hundredsToWords(g)} mil`;
    else text = `${hundredsToWords(g)} ${g === 1 ? singular : plural}`;
    chunks.push({ text, value: g });
  }

  // "e" antes do último grupo quando ele é < 100 ou centena redonda (mil e quinhentos, mil e um).
  return chunks
    .map((c, idx) => {
      if (idx === 0) return c.text;
      const isLast = idx === chunks.length - 1;
      const joinWithE = isLast && (c.value < 100 || c.value % 100 === 0);
      return `${joinWithE ? "e " : ""}${c.text}`;
    })
    .join(" ");
}

/** 1234.56 → "mil duzentos e trinta e quatro reais e cinquenta e seis centavos" */
export function currencyToWords(amount: number): string {
  const cents = Math.round(Math.abs(amount) * 100);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;

  const parts: string[] = [];
  if (reais > 0) {
    const words = integerToWords(reais);
    // "um milhão de reais", "dois bilhões de reais"
    const needsDe = reais >= 1_000_000 && reais % 1_000_000 === 0;
    parts.push(`${words} ${needsDe ? "de " : ""}${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) {
    parts.push(`${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }
  if (parts.length === 0) return "zero real";
  return parts.join(" e ");
}

/** Valor por extenso conforme o tipo da variável base (moeda, data, dia, percentual). */
export function toWords(type: DocumentFieldType, raw: string): string {
  if (!raw) return "";
  switch (type) {
    case "currency": {
      const amount = parseCurrency(raw);
      return amount === null ? "" : currencyToWords(amount);
    }
    case "date":
      return dateToWords(raw);
    case "day": {
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 ? integerToWords(n) : "";
    }
    case "percent": {
      const n = parsePercent(raw);
      return n === null || !Number.isInteger(n) || n < 0 ? "" : `${integerToWords(n)} por cento`;
    }
    default:
      return "";
  }
}

/**
 * Monta os dados para o template: respostas formatadas para exibição
 * + variáveis derivadas `*_extenso` (moeda, data, dia do mês, percentual).
 */
export function buildTemplateData(
  variables: Pick<DocumentVariable, "key" | "type">[],
  answers: Record<string, string>
): Record<string, string> {
  const data: Record<string, string> = {};
  for (const variable of variables) {
    const raw = answers[variable.key] ?? "";
    data[variable.key] = formatValue(variable.type, raw);
    const words = toWords(variable.type, raw);
    if (words) data[variable.key + EXTENSO_SUFFIX] = words;
  }
  return data;
}
