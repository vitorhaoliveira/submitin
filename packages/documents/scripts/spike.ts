/**
 * Spike de fidelidade: .docx → parse → merge → PDF (Gotenberg).
 *
 * Uso:
 *   GOTENBERG_URL=http://localhost:3030 pnpm spike [caminho.docx] [respostas.json]
 *
 * Sem argumentos usa o contrato de exemplo em test/fixtures.
 * Gera em out/: template.pdf (docx original convertido), merged.docx e merged.pdf.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseTemplate, mergeTemplate, convertDocxToPdf, TemplateError } from "../src";

const root = join(import.meta.dirname, "..");
const templatePath = resolve(process.argv[2] ?? join(root, "test/fixtures/contrato-matricula.docx"));
const answersPath = process.argv[3] ? resolve(process.argv[3]) : join(root, "test/fixtures/contrato-matricula.answers.json");
const outDir = join(root, "out");
mkdirSync(outDir, { recursive: true });

const template = readFileSync(templatePath);

let parsed;
try {
  parsed = parseTemplate(template);
} catch (err) {
  if (err instanceof TemplateError) {
    console.error("❌", err.message, ...err.details.map((d) => `\n   - ${d}`));
    process.exit(1);
  }
  throw err;
}

console.log(`\n${parsed.variables.length} variáveis detectadas:`);
console.table(parsed.variables.map(({ key, label, type }) => ({ key, label, type })));
if (parsed.unsupportedTags.length) console.warn("⚠️  Tags não suportadas:", parsed.unsupportedTags);

let answers: Record<string, string> = {};
try {
  answers = JSON.parse(readFileSync(answersPath, "utf8"));
} catch {
  console.warn(`Sem respostas em ${answersPath}; usando o nome da variável como valor.`);
  answers = Object.fromEntries(parsed.variables.map((v) => [v.key, `[${v.key}]`]));
}

const t0 = performance.now();
const merged = mergeTemplate(template, parsed.variables, answers);
const t1 = performance.now();
const [templatePdf, mergedPdf] = await Promise.all([
  convertDocxToPdf(template),
  convertDocxToPdf(merged),
]);
const t2 = performance.now();

writeFileSync(join(outDir, "template.pdf"), templatePdf);
writeFileSync(join(outDir, "merged.docx"), merged);
writeFileSync(join(outDir, "merged.pdf"), mergedPdf);

console.log(`\nmerge: ${(t1 - t0).toFixed(0)}ms · pdf: ${(t2 - t1).toFixed(0)}ms`);
console.log(`→ ${outDir}/{template.pdf, merged.docx, merged.pdf}`);
