import "dotenv/config";
import { z } from "zod";

/**
 * Boot-time environment validation. Fails fast with a clear error message if
 * required variables are missing/malformed, instead of the old prototype's
 * silent-fallback behavior.
 *
 * NOTE: DATABASE_URL is intentionally left as a plain string check (not a
 * live connection test) so the server can boot and serve /api/health even
 * before a real Postgres connection string has been filled in.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  SUPABASE_URL: z.string().url({ message: "SUPABASE_URL must be a valid URL" }),
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
  SUPABASE_JWKS_URL: z.string().url({ message: "SUPABASE_JWKS_URL must be a valid URL" }),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
