import { connection, NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { githubInstallation } from "@/db/schema";
import { serverEnv } from "@/lib/env";
import { AppError } from "@/server/errors";
import { getSessionUser } from "@/server/session";
import { getGithubApp, githubData } from "@/server/services/github/client";
import { INSTALL_STATE_COOKIE, INSTALL_STATE_PATH } from "@/server/services/github/install-state";
import { findOwnInstallation, syncInstallationRepos } from "@/server/services/github/sync";

const paramsSchema = z.object({
  installation_id: z.coerce.number().int().positive(),
  setup_action: z.string().optional(),
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
});

const installationsSchema = z.object({
  installations: z.array(
    z.object({
      id: z.number().int(),
      account: z
        .object({ login: z.string().optional(), slug: z.string().optional(), type: z.string().optional() })
        .nullable(),
    }),
  ),
});
const PAGE = 100;
const MAX_PAGES = 20;

const redirectTo = (path: string) => NextResponse.redirect(new URL(path, serverEnv().BETTER_AUTH_URL));

/**
 * Ownership proof: the user's own OAuth token must list the installation.
 * The installation_id in the URL alone is never trusted. The user token is discarded after this call.
 */
async function proveInstallation(code: string, installationId: number) {
  const userOctokit = await getGithubApp().oauth.getUserOctokit({ code });
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { installations } = await githubData(
      userOctokit.request("GET /user/installations", { per_page: PAGE, page }),
      installationsSchema,
    );
    const found = installations.find((i) => i.id === installationId);
    if (found) {
      return {
        accountLogin: found.account?.login ?? found.account?.slug ?? "unknown",
        accountType: found.account?.type ?? "Enterprise",
      };
    }
    if (installations.length < PAGE) break;
  }
  throw new AppError("forbidden", "Installation is not accessible to this GitHub user.");
}

async function connect(
  userId: string,
  params: z.infer<typeof paramsSchema>,
  cookieState: string | undefined,
) {
  const { installation_id: installationId, code, state } = params;
  if (code) {
    if (!state || !cookieState || state !== cookieState)
      throw new AppError("forbidden", "Install state mismatch.");
    const account = await proveInstallation(code, installationId);
    const db = getDb();
    const [existing] = await db
      .select({ userId: githubInstallation.userId })
      .from(githubInstallation)
      .where(eq(githubInstallation.id, installationId));
    if (existing && existing.userId !== userId)
      throw new AppError("conflict", "This installation is already connected to another account.");
    await db
      .insert(githubInstallation)
      .values({ id: installationId, userId, ...account })
      .onConflictDoUpdate({ target: githubInstallation.id, set: { ...account, updatedAt: new Date() } });
  } else if (!(await findOwnInstallation(userId, installationId))) {
    // No code: only a resync after "update" is allowed, for an installation this user already owns.
    throw new AppError("forbidden", "Unknown installation.");
  }
  await syncInstallationRepos(installationId, userId);
}

/** GitHub redirects here after install/update (the app's Setup URL). */
export async function GET(req: NextRequest) {
  await connection();
  const user = await getSessionUser();
  if (!user) return redirectTo("/sign-in");

  const cookieState = req.cookies.get(INSTALL_STATE_COOKIE)?.value;
  let target = "/settings?github=connected";
  try {
    const params = paramsSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    await connect(user.id, params, cookieState);
  } catch (error) {
    // Message only: never log the code, state or tokens.
    console.error("GitHub setup failed:", error instanceof Error ? error.message : "unknown error");
    target = "/settings?github=error";
  }
  const response = redirectTo(target);
  // State is single use whatever the outcome.
  response.cookies.set(INSTALL_STATE_COOKIE, "", { path: INSTALL_STATE_PATH, maxAge: 0 });
  return response;
}
