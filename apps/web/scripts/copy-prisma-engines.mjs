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
    entry.isDirectory() ? copyDir(from, to) : fs.copyFileSync(from, to);
  }
}

// 🔍 encontra o engine no pnpm store
const pnpmDir = path.resolve("../../node_modules/.pnpm");
let src = null;

if (exists(path.resolve("../../node_modules/.prisma/client"))) {
  src = path.resolve("../../node_modules/.prisma/client");
} else if (exists(pnpmDir)) {
  for (const d of fs.readdirSync(pnpmDir)) {
    const candidate = path.join(pnpmDir, d, "node_modules", ".prisma", "client");
    if (exists(candidate)) {
      src = candidate;
      break;
    }
  }
}

if (!src) {
  console.error("❌ Prisma engine not found");
  process.exit(1);
}

// ✅ destino EXATO que o Prisma usa no runtime
const dest = path.resolve(".prisma/client");

copyDir(src, dest);

console.log("✅ Prisma engine copied");
console.log("From:", src);
console.log("To:", dest);
