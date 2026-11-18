import "server-only";
import { z } from "zod";

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be 32+ chars"),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: optional,
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/**
 * Validated server env. Parsed on first use (not at import) so builds and
 * unrelated routes don't crash when a variable is missing.
 */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${missing}. See the example env file.`);
  }
  cached = parsed.data;
  return cached;
}
