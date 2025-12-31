import fs from "node:fs";
import path from "node:path";

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

// Fonte: onde o prisma generate coloca os engines (pnpm store)
const pnpmDir = path.resolve("../../node_modules/.pnpm");
let src = null;

if (exists(path.resolve("../../node_modules/.prisma/client"))) {
  src = path.resolve("../../node_modules/.prisma/client");
} else if (exists(pnpmDir)) {
  const entries = fs.readdirSync(pnpmDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const e of entries) {
    const candidate = path.join(pnpmDir, e.name, "node_modules", ".prisma", "client");
    if (exists(candidate)) { src = candidate; break; }
  }
}

if (!src) {
  console.error("❌ Could not find .prisma/client to copy.");
  process.exit(1);
}

// Destino: dentro do standalone bundle
// para Root Directory = apps/web:
const dest = path.resolve(".next/standalone/apps/web/.prisma/client");

// Copia engines e arquivos do client
copyDir(src, dest);

console.log("✅ Copied Prisma engines from:", src);
console.log("✅ Into standalone:", dest);
  