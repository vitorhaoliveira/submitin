import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "./validations";

const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

const hasAuthEnv = !!process.env.AUTH_SECRET;
const hasDbEnv = !!process.env.DATABASE_URL;

// Log de diagnóstico (apenas em desenvolvimento)
if (!isBuildTime && process.env.NODE_ENV === "development") {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 [NextAuth] Diagnóstico de Configuração");
  console.log("=".repeat(60));

  if (!hasDbEnv) {
    console.error("❌ DATABASE_URL: Não configurado");
  } else {
    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl.includes("supabase")) {
      console.log("✅ DATABASE_URL: Configurado (Supabase)");
    } else {
      console.log("✅ DATABASE_URL: Configurado");
    }
  }

  if (!hasAuthEnv) {
    console.error("❌ AUTH_SECRET: Não configurado");
  } else {
    console.log("✅ AUTH_SECRET: Configurado");
  }

  console.log("✅ Provider: Credentials (Email/Senha)");
  console.log("=".repeat(60) + "\n");
}

function getAdapter() {
  if (isBuildTime || !hasDbEnv) {
    return undefined;
  }

  try {
    const { prisma } = require("@submitin/database");
    return prisma ? PrismaAdapter(prisma) : undefined;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ [NextAuth] Erro ao carregar Prisma adapter:", error);
    }
    return undefined;
  }
}

function getPrisma() {
  try {
    const { prisma } = require("@submitin/database");
    return prisma;
  } catch {
    return null;
  }
}

const authConfig = {
  adapter: getAdapter(),
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/login?error=auth",
  },

  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        // Validação básica
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Busca usuário no banco
        const prisma = getPrisma();
        if (!prisma) {
          console.error("❌ [Auth] Prisma não disponível");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) {
          // Usuário não existe ou não tem senha configurada
          return null;
        }

        // Verifica a senha
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return null;
        }

        // Retorna dados do usuário (sem a senha)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },

  secret: hasAuthEnv ? process.env.AUTH_SECRET : "build-time-placeholder-secret",
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig) as any;
