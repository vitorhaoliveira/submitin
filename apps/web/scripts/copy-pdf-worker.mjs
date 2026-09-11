// Copia o worker do pdf.js para public/vendor (servido estático, carregado só no preview).
// O pdf.js 6 usa Promise.withResolvers (iOS < 17.4 não tem): o worker é carregado por
// um módulo de entrada que aplica o polyfill antes.
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pdfjs-dist/package.json"));
const target = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "vendor");
mkdirSync(target, { recursive: true });
copyFileSync(join(root, "legacy/build/pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
writeFileSync(
  join(target, "pdf-polyfills.mjs"),
  `Promise.withResolvers ??= function () {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
`
);
writeFileSync(join(target, "pdf.worker.entry.mjs"), `import "./pdf-polyfills.mjs";\nimport "./pdf.worker.min.mjs";\n`);
