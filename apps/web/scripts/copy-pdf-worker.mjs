// Copia o worker do pdf.js para public/vendor (servido estático, carregado só no preview).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pdfjs-dist/package.json"));
const target = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "vendor");
mkdirSync(target, { recursive: true });
copyFileSync(join(root, "legacy/build/pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
