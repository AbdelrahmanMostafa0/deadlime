import { randomBytes } from "node:crypto";
import { connection, NextResponse } from "next/server";
import { githubAppConfig, serverEnv } from "@/lib/env";
import { getSessionUser } from "@/server/session";
import { INSTALL_STATE_COOKIE, INSTALL_STATE_PATH } from "@/server/services/github/install-state";

const STATE_TTL_SECONDS = 10 * 60;

const redirectTo = (path: string) => NextResponse.redirect(new URL(path, serverEnv().BETTER_AUTH_URL));

/** Starts the GitHub App install: remember a random state, then send the user to GitHub. */
export async function GET() {
  await connection();
  const user = await getSessionUser();
  if (!user) return redirectTo("/sign-in");
  const config = githubAppConfig();
  if (!config) return redirectTo("/settings?github=error");

  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(
    `https://github.com/apps/${encodeURIComponent(config.slug)}/installations/new?state=${state}`,
  );
  response.cookies.set(INSTALL_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: INSTALL_STATE_PATH,
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}
