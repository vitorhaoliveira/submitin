/**
 * Convenção de variáveis do template: `{{snake_case}}`.
 * Normalização: trim, lowercase, remove acentos, espaços/hífens → `_`.
 */

export type DocumentFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "cpf"
  | "cnpj"
  | "cep"
  | "date"
  | "currency";

export type DocumentVariable = {
  key: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  order: number;
};

/** Sufixo de variável derivada: `{{valor_extenso}}` é calculada a partir de `{{valor}}`. */
export const EXTENSO_SUFFIX = "_extenso";

export function normalizeVariableKey(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const TYPE_RULES: Array<{ type: DocumentFieldType; words: string[] }> = [
  { type: "cnpj", words: ["cnpj"] },
  { type: "cpf", words: ["cpf"] },
  { type: "email", words: ["email", "e_mail"] },
  { type: "phone", words: ["telefone", "celular", "whatsapp", "fone"] },
  { type: "cep", words: ["cep"] },
  { type: "date", words: ["data", "nascimento", "vencimento"] },
  { type: "currency", words: ["valor", "preco", "mensalidade", "taxa", "matricula_valor"] },
  { type: "textarea", words: ["observacao", "observacoes", "descricao"] },
];

/** Heurística do nome da variável → tipo de campo (usuário pode sobrescrever). */
export function inferFieldType(key: string): DocumentFieldType {
  const parts = key.split("_");
  // `dia_vencimento`, `dia_pagamento`: dia do mês, não uma data completa.
  if (parts[0] === "dia") return "text";
  for (const rule of TYPE_RULES) {
    for (const word of rule.words) {
      // Casa por segmento inteiro (`data_inicio`) ou prefixo composto (`e_mail`),
      // evitando falsos positivos como `candidato` → "data".
      if (word.includes("_") ? key.includes(word) : parts.includes(word)) return rule.type;
    }
  }
  return "text";
}

const LABEL_WORDS: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  cep: "CEP",
  rg: "RG",
  uf: "UF",
  email: "E-mail",
  nao: "não",
  numero: "número",
  endereco: "endereço",
  responsavel: "responsável",
  matricula: "matrícula",
  observacao: "observação",
  observacoes: "observações",
  descricao: "descrição",
  preco: "preço",
  inicio: "início",
  mes: "mês",
  horario: "horário",
  periodo: "período",
};

/** `nome_responsavel` → "Nome responsável" */
export function labelFromKey(key: string): string {
  const words = key.split("_").filter(Boolean).map((w) => LABEL_WORDS[w] ?? w);
  const label = words.join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Transforma as tags encontradas no documento em campos de formulário.
 * Tags repetidas viram um único campo; `*_extenso` com base existente não vira campo.
 */
export function buildVariables(rawTags: string[]): DocumentVariable[] {
  const keys: string[] = [];
  for (const tag of rawTags) {
    const key = normalizeVariableKey(tag);
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys
    .filter((key) => !isDerivedKey(key, keys))
    .map((key, order) => ({
      key,
      label: labelFromKey(key),
      type: inferFieldType(key),
      required: true,
      order,
    }));
}

export function isDerivedKey(key: string, allKeys: string[]): boolean {
  if (!key.endsWith(EXTENSO_SUFFIX)) return false;
  return allKeys.includes(key.slice(0, -EXTENSO_SUFFIX.length));
}
