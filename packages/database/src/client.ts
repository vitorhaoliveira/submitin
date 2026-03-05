import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuração de logs baseada no ambiente
const logConfig: Prisma.LogLevel[] = process.env.NODE_ENV === "development"
  ? ["query", "error", "warn"]
  : ["error"];

// Em produção (ex.: Vercel), limitar a 1 conexão por instância para não estourar
// o limite do Supabase (Session mode). Melhor ainda: use a URL do Connection Pooler
// (porta 6543) com ?pgbouncer=true no DATABASE_URL.
function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (process.env.NODE_ENV !== "production" || !url) return undefined;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=1`;
}

const datasourceUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
    errorFormat: "pretty",
    ...(datasourceUrl && { datasources: { db: { url: datasourceUrl } } }),
  });

// Tratamento de erros de conexão
if (process.env.NODE_ENV === "development") {
  prisma.$connect().catch((error: unknown) => {
    if (error instanceof Error) {
      if (error.message.includes("Can't reach database server") || 
          error.message.includes("localhost:5432")) {
        console.error("\n" + "=".repeat(60));
        console.error("❌ [Prisma] Erro de conexão com o banco de dados");
        console.error("=".repeat(60));
        console.error("O Prisma está tentando conectar em localhost:5432");
        console.error("\n🔍 Possíveis soluções:");
        console.error("1. Se você usa PostgreSQL local:");
        console.error("   - Certifique-se de que o PostgreSQL está rodando");
        console.error("   - Verifique se a porta 5432 está correta");
        console.error("\n2. Se você usa Supabase:");
        console.error("   - Atualize DATABASE_URL com a connection string do Supabase");
        console.error("   - Obtenha em: Supabase Dashboard > Project Settings > Database");
        console.error("   - Em produção (Vercel): use Connection Pooler (porta 6543) com ?pgbouncer=true");
        console.error("     para evitar 'max clients reached'.");
        console.error("=".repeat(60) + "\n");
      }
    }
  });
}

// Reuse Prisma Client in production to avoid too many connections
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production, also reuse the client to prevent connection pool exhaustion
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}

