import "server-only";
import { App } from "@octokit/app";
import type { z } from "zod";
import { githubAppConfig } from "@/lib/env";
import { AppError } from "../../errors";

let app: App | undefined;

/** The one GitHub App client, created on first use. Throws when the app isn't configured. */
export function getGithubApp(): App {
  if (app) return app;
  const config = githubAppConfig();
  if (!config) throw new AppError("not_configured", "The GitHub integration is not configured.");
  app = new App({
    appId: config.appId,
    privateKey: config.privateKey,
    oauth: { clientId: config.clientId, clientSecret: config.clientSecret },
    webhooks: { secret: config.webhookSecret },
  });
  return app;
}

/** Throws a clear AppError when the GitHub App env vars are not all set. */
export function assertGithubConfigured() {
  if (!githubAppConfig())
    throw new AppError("not_configured", "The GitHub integration is not configured on this server.");
}

/** Octokit authenticated as the app installation (short-lived token, cached by octokit). */
export function installationOctokit(installationId: number) {
  return getGithubApp().getInstallationOctokit(installationId);
}

/**
 * Await a GitHub API call and validate its body. Maps failures to AppError;
 * never logs request details, only the status and message.
 */
export async function githubData<S extends z.ZodType>(
  call: Promise<{ data: unknown }>,
  schema: S,
): Promise<z.output<S>> {
  let data: unknown;
  try {
    data = (await call).data;
  } catch (error) {
    const status = error instanceof Error && "status" in error ? error.status : undefined;
    if (status === 404) throw new AppError("not_found", "Not found on GitHub, or the app can't see it.");
    console.error("GitHub request failed", status, error instanceof Error ? error.message : "");
    throw new AppError("unavailable", "GitHub request failed. Try again shortly.");
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error("Unexpected GitHub response shape");
    throw new AppError("unavailable", "GitHub returned an unexpected response.");
  }
  return parsed.data;
}
