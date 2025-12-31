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

function findFirstExistingDir(candidates) {
  return candidates.find(exists);
}

function findInPnpmStore(patternDirName) {
  const pnpmDir = path.resolve("../../node_modules/.pnpm");
  if (!exists(pnpmDir)) return null;

  // procura 1 nível abaixo (rápido e suficiente para .pnpm)
  const entries = fs.readdirSync(pnpmDir, { withFileTypes: true }).filter(d => d.isDirectory());

  for (const e of entries) {
    const candidate = path.join(pnpmDir, e.name, "node_modules", patternDirName);
    if (exists(candidate)) return candidate;
  }
  return null;
}

// 1) paths comuns
const directCandidates = [
  path.resolve("node_modules/.prisma/client"),
  path.resolve("../../node_modules/.prisma/client"),
  path.resolve("../../node_modules/@prisma/client"),
  path.resolve("node_modules/@prisma/client"),
];

let src =
  findFirstExistingDir(directCandidates) ||
  // 2) dentro do store do pnpm
  findInPnpmStore(".prisma/client") ||
  findInPnpmStore("@prisma/client") ||
  findInPnpmStore("@prisma/engines");

if (!src) {
  console.error("❌ Prisma engine folder not found. Looked in:", [
    ...directCandidates,
    "../../node_modules/.pnpm/*/node_modules/.prisma/client",
    "../../node_modules/.pnpm/*/node_modules/@prisma/client",
    "../../node_modules/.pnpm/*/node_modules/@prisma/engines",
  ]);
  process.exit(1);
}

// Se o src for @prisma/client, tenta achar a pasta .prisma ao lado (que é onde costuma estar o engine)
const neighborPrismaClient = path.join(src, "..", ".prisma", "client");
if (src.endsWith("@prisma/client") && exists(neighborPrismaClient)) {
  src = neighborPrismaClient;
}

const dest = path.resolve(".prisma/client");
copyDir(src, dest);

console.log("✅ Copied Prisma engines from:", src);
console.log("✅ Into:", dest);
