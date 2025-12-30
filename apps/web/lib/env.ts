import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().min(1, "AUTH_URL is required"),
  AUTH_RESEND_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);

// Validate required env vars at build time
if (typeof window === "undefined") {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Missing required environment variables:");
    console.error(error);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing required environment variables for production build");
    }
  }
}
