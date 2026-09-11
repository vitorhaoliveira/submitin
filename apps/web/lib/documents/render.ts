import { createHash } from "node:crypto";
import {
  buildTemplateData,
  convertDocxToPdf,
  mergeTemplate,
  stampBranding,
  type DocumentFieldType,
} from "@submitin/documents";
import { getObject } from "@/lib/storage";
import { appBaseUrl } from "./service";

type Variable = { key: string; type: DocumentFieldType };

/**
 * Impressão digital do documento final: template + dados já formatados + marca.
 * Se o preview e a geração chegarem ao mesmo hash, o PDF do preview é reaproveitado.
 */
export function documentDataHash(
  templateId: string,
  variables: Variable[],
  answers: Record<string, string>,
  branded: boolean
): string {
  const data = buildTemplateData(variables, answers);
  const ordered = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  return createHash("sha256").update(JSON.stringify({ templateId, branded, data: ordered })).digest("hex");
}

/** Mescla o template e converte para PDF (uma chamada ao LibreOffice). */
export async function renderDocument(input: {
  template: { fileKey: string; fileName: string };
  variables: Variable[];
  answers: Record<string, string>;
  branded: boolean;
}): Promise<{ docx: Buffer; pdf: Buffer }> {
  const docx = mergeTemplate(await getObject(input.template.fileKey), input.variables, input.answers);
  let pdf = await convertDocxToPdf(docx, { filename: input.template.fileName });
  if (input.branded) {
    pdf = await stampBranding(pdf, { url: `${appBaseUrl()}/?ref=documento` });
  }
  return { docx, pdf };
}
