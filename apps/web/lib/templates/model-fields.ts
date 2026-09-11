import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseTemplate, type DocumentFieldType } from "@submitin/documents";
import type { DocumentModel } from "./catalog";
import { appBaseUrl } from "@/lib/documents/service";

/** Campo do modelo já com os ajustes do catálogo (usado na página e na criação). */
export type ModelField = {
  key: string;
  label: string;
  type: DocumentFieldType | "textarea" | "select";
  required: boolean;
  options?: string[];
  nature: string;
  company: boolean;
};

/**
 * Lê o .docx do modelo: do disco (public/modelos, incluído nas funções via
 * outputFileTracingIncludes) ou, se não estiver lá, pela URL pública do site.
 */
export async function readModelDocx(slug: string): Promise<Buffer> {
  try {
    return await readFile(join(process.cwd(), "public", "modelos", `${slug}.docx`));
  } catch {
    const res = await fetch(`${appBaseUrl()}/modelos/${slug}.docx`, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Modelo ${slug} indisponível (${res.status}).`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export function applyModelOverrides(
  model: DocumentModel,
  variables: { key: string; label: string; type: string; required: boolean; nature: string; options?: string[] }[]
): ModelField[] {
  return variables.map((v) => {
    const o = model.fields[v.key] ?? {};
    const company = model.companyKeys.includes(v.key);
    return {
      key: v.key,
      label: o.label ?? v.label,
      type: (o.type ?? v.type) as ModelField["type"],
      required: o.required ?? v.required,
      options: o.options ?? v.options,
      nature: company ? "fixa" : v.nature,
      company,
    };
  });
}

export async function modelFields(model: DocumentModel): Promise<ModelField[]> {
  const { variables } = parseTemplate(await readModelDocx(model.slug));
  return applyModelOverrides(model, variables);
}
