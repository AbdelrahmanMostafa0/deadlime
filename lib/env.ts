import "server-only";
import { createPrivateKey } from "node:crypto";
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
  GITHUB_APP_ID: optional,
  GITHUB_APP_SLUG: optional,
  GITHUB_APP_PRIVATE_KEY: optional,
  GITHUB_APP_CLIENT_ID: optional,
  GITHUB_APP_CLIENT_SECRET: optional,
  GITHUB_WEBHOOK_SECRET: optional,
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

export type GithubAppConfig = {
  appId: string;
  slug: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
};

/**
 * GitHub downloads App keys as PKCS#1 (`BEGIN RSA PRIVATE KEY`), but @octokit/app signs with
 * WebCrypto, which only takes PKCS#8. Accept either, on one line with literal "\n" or multi-line.
 */
function toPkcs8(pem: string): string {
  const normalized = pem.replaceAll("\\n", "\n");
  return createPrivateKey(normalized).export({ type: "pkcs8", format: "pem" }).toString();
}

/** GitHub App settings, or null when any of them is missing (the integration is then off). */
export function githubAppConfig(): GithubAppConfig | null {
  const env = serverEnv();
  const { GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_CLIENT_ID } = env;
  const { GITHUB_APP_CLIENT_SECRET, GITHUB_WEBHOOK_SECRET } = env;
  if (
    !GITHUB_APP_ID ||
    !GITHUB_APP_SLUG ||
    !GITHUB_APP_PRIVATE_KEY ||
    !GITHUB_APP_CLIENT_ID ||
    !GITHUB_APP_CLIENT_SECRET ||
    !GITHUB_WEBHOOK_SECRET
  )
    return null;
  return {
    appId: GITHUB_APP_ID,
    slug: GITHUB_APP_SLUG,
    privateKey: toPkcs8(GITHUB_APP_PRIVATE_KEY),
    clientId: GITHUB_APP_CLIENT_ID,
    clientSecret: GITHUB_APP_CLIENT_SECRET,
    webhookSecret: GITHUB_WEBHOOK_SECRET,
  };
}
