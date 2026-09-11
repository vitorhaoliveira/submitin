import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { DXT } from "docxtemplater";
import { buildVariables, normalizeVariableKey, type DocumentVariable } from "./variables";
import { buildTemplateData } from "./format";

const DELIMITERS = { start: "{{", end: "}}" };

export class TemplateError extends Error {
  constructor(
    message: string,
    /** Erros individuais, legíveis pelo usuário (ex.: tag sem fechamento). */
    public readonly details: string[] = []
  ) {
    super(message);
    this.name = "TemplateError";
  }
}

export type ParseResult = {
  variables: DocumentVariable[];
  /** Tags encontradas mas não suportadas no MVP (loops, condições, XML bruto). */
  unsupportedTags: string[];
};

type DocxtemplaterErrorItem = {
  properties?: { id?: string; xtag?: string; context?: string; explanation?: string };
};

function describeError(item: DocxtemplaterErrorItem): string {
  const p = item.properties ?? {};
  const where = p.context ? ` perto de "${p.context.slice(0, 40)}"` : "";
  switch (p.id) {
    case "unclosed_tag":
      return `Variável sem "}}" de fechamento${where}.`;
    case "unopened_tag":
      return `"}}" sem "{{" de abertura${where}.`;
    case "duplicate_open_tag":
      return `"{{" duplicado${where}.`;
    case "duplicate_close_tag":
      return `"}}" duplicado${where}.`;
    case "unclosed_loop":
    case "unopened_loop":
    case "closing_tag_does_not_match_opening_tag":
      return `Bloco condicional/repetição mal formado${where}.`;
    default:
      return p.explanation ?? `Erro no template${where}.`;
  }
}

function openZip(buffer: Buffer | Uint8Array): PizZip {
  try {
    return new PizZip(buffer);
  } catch {
    throw new TemplateError("Arquivo inválido: envie um documento .docx (Word).");
  }
}

function createDocxtemplater(zip: PizZip, modules: DXT.Module[] = []): Docxtemplater {
  try {
    return new Docxtemplater(zip, {
      delimiters: DELIMITERS,
      paragraphLoop: true,
      linebreaks: true,
      modules,
      // `{{ Nome do Aluno }}` e `{{nome_do_aluno}}` resolvem para a mesma chave.
      parser: (tag: string) => ({
        get: (scope: Record<string, unknown>) =>
          tag === "." ? scope : scope[normalizeVariableKey(tag)],
      }),
      nullGetter: () => "",
    });
  } catch (err) {
    const errors = (err as { properties?: { errors?: DocxtemplaterErrorItem[] } }).properties?.errors;
    if (errors?.length) {
      throw new TemplateError(
        "O documento tem variáveis mal formatadas.",
        errors.map(describeError)
      );
    }
    if ((err as { properties?: { id?: string } }).properties?.id === "filetype_not_identified") {
      throw new TemplateError("Arquivo inválido: envie um documento .docx (Word).");
    }
    throw err;
  }
}

function collectTags(parts: DXT.Part[], simple: string[], unsupported: string[]) {
  for (const part of parts) {
    if (part.type !== "placeholder") continue;
    if (!part.module) {
      simple.push(part.value);
    } else {
      unsupported.push(part.raw ?? part.value);
      if (part.subparsed) collectTags(part.subparsed, simple, unsupported);
    }
  }
}

/** Extrai as variáveis `{{}}` do .docx (corpo, cabeçalho, rodapé, tabelas). */
export function parseTemplate(buffer: Buffer | Uint8Array): ParseResult {
  const simple: string[] = [];
  const unsupported: string[] = [];
  // Módulo mínimo que observa as tags de cada parte do documento após o parse.
  const collector: DXT.Module = {
    name: "CollectTags",
    postparse(parsed: DXT.Part[]) {
      collectTags(parsed, simple, unsupported);
      return parsed;
    },
  };
  createDocxtemplater(openZip(buffer), [collector]);

  const variables = buildVariables(simple);
  if (variables.length === 0) {
    throw new TemplateError(
      "Nenhuma variável encontrada. Marque os campos no Word no formato {{nome_da_variavel}}."
    );
  }
  return { variables, unsupportedTags: [...new Set(unsupported)] };
}

/** Mescla as respostas no template, preservando a formatação do .docx. */
export function mergeTemplate(
  buffer: Buffer | Uint8Array,
  variables: Pick<DocumentVariable, "key" | "type">[],
  answers: Record<string, string>
): Buffer {
  const doc = createDocxtemplater(openZip(buffer));
  doc.render(buildTemplateData(variables, answers));
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
