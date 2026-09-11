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
  | "currency"
  | "percent"
  | "day"
  | "select";

/**
 * Natureza da variável:
 * - pergunta: o respondente preenche no formulário
 * - fixa: valor constante definido pela empresa no setup
 * - pre_preenchida: valor vem do link personalizado (sem link, vira pergunta)
 * - automatica: resolvida pelo sistema na geração (ex.: data_assinatura)
 */
export const NATURES = ["pergunta", "fixa", "pre_preenchida", "automatica"] as const;
export type Nature = (typeof NATURES)[number];

export type DocumentVariable = {
  key: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  order: number;
  nature: Nature;
  /** Opções para tipo "select" (ex.: sim/não). */
  options?: string[];
};

/** Variáveis que o sistema sabe resolver sozinho (natureza "automatica"). */
export const AUTOMATIC_KEYS: Record<string, DocumentFieldType> = {
  data_assinatura: "date",
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
  { type: "percent", words: ["percentual", "porcentagem"] },
  { type: "textarea", words: ["observacao", "observacoes", "descricao"] },
];

/** `autoriza_*` vira sim/não. */
export const YES_NO_OPTIONS = ["Sim", "Não"];

/** Heurística do nome da variável → tipo de campo (usuário pode sobrescrever). */
export function inferFieldType(key: string): DocumentFieldType {
  const parts = key.split("_");
  // `dia`, `dia_vencimento`, `dia_pagamento`: dia do mês (1–31), não uma data.
  if (parts[0] === "dia") return "day";
  if (parts.includes("autoriza")) return "select";
  for (const rule of TYPE_RULES) {
    for (const word of rule.words) {
      // Casa por segmento inteiro (`data_inicio`) ou prefixo composto (`e_mail`),
      // evitando falsos positivos como `candidato` → "data".
      if (word.includes("_") ? key.includes(word) : parts.includes(word)) return rule.type;
    }
  }
  return "text";
}

/** Padrão da detecção (spec): tudo é pergunta, exceto o que o sistema resolve sozinho. */
export function inferNature(key: string): Nature {
  return key in AUTOMATIC_KEYS ? "automatica" : "pergunta";
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
  // `{{data_assinatura_extenso}}` sozinho no Word: a base automática entra implícita.
  for (const key of [...keys]) {
    const base = key.endsWith(EXTENSO_SUFFIX) ? key.slice(0, -EXTENSO_SUFFIX.length) : null;
    if (base && base in AUTOMATIC_KEYS && !keys.includes(base)) keys.push(base);
  }
  return keys
    .filter((key) => !isDerivedKey(key, keys))
    .map((key, order) => ({
      key,
      label: labelFromKey(key),
      type: AUTOMATIC_KEYS[key] ?? inferFieldType(key),
      required: true,
      order,
      nature: inferNature(key),
      ...(key.split("_").includes("autoriza") && { options: YES_NO_OPTIONS }),
    }));
}

export function isDerivedKey(key: string, allKeys: string[]): boolean {
  if (!key.endsWith(EXTENSO_SUFFIX)) return false;
  return allKeys.includes(key.slice(0, -EXTENSO_SUFFIX.length));
}
