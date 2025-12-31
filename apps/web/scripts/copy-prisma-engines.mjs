import fs from "node:fs";
import path from "node:path";

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
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

// Onde o Prisma geralmente gera os engines:
const candidates = [
  // 1) node_modules do próprio app
  path.resolve("node_modules/.prisma/client"),
  // 2) node_modules na raiz do monorepo (apps/web -> ../../)
  path.resolve("../../node_modules/.prisma/client"),
];

const src = candidates.find(exists);

if (!src) {
  console.error("❌ Prisma engine folder not found. Looked in:", candidates);
  process.exit(1);
}

const dest = path.resolve(".prisma/client");
copyDir(src, dest);

console.log("✅ Copied Prisma engines from:", src);
console.log("✅ Into:", dest);
