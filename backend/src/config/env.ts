import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.preprocess(
      (value) => (value === "" || value === undefined ? 3001 : value),
      z.coerce.number().int().min(1).max(65535),
    ),

    APP_ORIGIN: z.string().url().default("http://localhost:5173"),

    // Supabase configuration
    SUPABASE_URL: z
      .string()
      .trim()
      .url("SUPABASE_URL must be a valid URL"),

    SUPABASE_PUBLISHABLE_KEY: z.string().trim().optional(),
    SUPABASE_ANON_KEY: z.string().trim().optional(),

    // Resend configuration
    RESEND_API_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(1).optional(),
    ),

    EMAIL_FROM: z
      .string()
      .trim()
      .default("CareOrbit 360 <onboarding@resend.dev>"),
  })
  .transform((data, ctx) => {
    const key = data.SUPABASE_PUBLISHABLE_KEY || data.SUPABASE_ANON_KEY;
    if (!key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Either SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY must be provided.",
        path: ["SUPABASE_PUBLISHABLE_KEY"],
      });
      return z.NEVER;
    }

    if (key.startsWith("sb_anon_")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Invalid Supabase key prefix: 'sb_anon_'. Supabase client keys should start with 'sb_publishable_' or be a legacy JWT anon key.",
        path: ["SUPABASE_PUBLISHABLE_KEY"],
      });
      return z.NEVER;
    }

    return {
      ...data,
      SUPABASE_ANON_KEY: key,
      SUPABASE_PUBLISHABLE_KEY: key,
    };
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);

  throw new Error(
    "Backend startup failed. Check your backend/.env configuration.",
  );
}

export const env = parsed.data;
