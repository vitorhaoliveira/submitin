import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";

// Check if we're in build mode (Next.js sets this during build)
// During Vercel build, NEXT_PHASE is set to "phase-production-build"
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

// Check if required environment variables are available
const hasRequiredEnvVars = !!(
  process.env.AUTH_SECRET &&
  process.env.DATABASE_URL
);

// Lazy adapter initialization - only at runtime, never during build
function getAdapter() {
  // Skip adapter during build
  if (isBuildTime || !hasRequiredEnvVars) {
    return undefined;
  }
  
  try {
    // Dynamic require to avoid build-time initialization
    const { prisma } = require("@submitin/database");
    return prisma ? PrismaAdapter(prisma) : undefined;
  } catch (error) {
    // Silently fail - adapter will be undefined (JWT strategy doesn't require it)
    return undefined;
  }
}

const authConfig = {
  adapter: getAdapter(),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  providers: hasRequiredEnvVars && process.env.AUTH_RESEND_KEY ? [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "submitin <noreply@submitin.dev>",
    }),
  ] : [],
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
  secret: hasRequiredEnvVars ? process.env.AUTH_SECRET : "build-time-placeholder-secret",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig) as any;
