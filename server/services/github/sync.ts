import "server-only";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { githubInstallation, githubRepo } from "@/db/schema";
import { githubData, installationOctokit } from "./client";

const PAGE = 100;
const MAX_PAGES = 50;

const repoSchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  default_branch: z.string().default("main"),
  private: z.boolean(),
  archived: z.boolean().default(false),
});
const repoPageSchema = z.object({ repositories: z.array(repoSchema) });

/** Mirror the repositories an installation can see into github_repo, dropping the ones it lost. */
export async function syncInstallationRepos(installationId: number, userId: string) {
  const octokit = await installationOctokit(installationId);
  const repos: z.infer<typeof repoSchema>[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { repositories } = await githubData(
      octokit.request("GET /installation/repositories", { per_page: PAGE, page }),
      repoPageSchema,
    );
    repos.push(...repositories);
    if (repositories.length < PAGE) break;
  }

  const db = getDb();
  const ids = repos.map((r) => r.id);
  // Delete first so a recreated repo reusing a full_name can't trip the (user, name) unique key.
  const removeStale = db
    .delete(githubRepo)
    .where(
      ids.length
        ? and(eq(githubRepo.installationId, installationId), notInArray(githubRepo.id, ids))
        : eq(githubRepo.installationId, installationId),
    );
  if (!repos.length) {
    await removeStale;
    return;
  }
  await db.batch([
    removeStale,
    db
      .insert(githubRepo)
      .values(
        repos.map((r) => ({
          id: r.id,
          installationId,
          userId,
          fullName: r.full_name,
          defaultBranch: r.default_branch,
          private: r.private,
          archived: r.archived,
        })),
      )
      .onConflictDoUpdate({
        target: githubRepo.id,
        set: {
          fullName: sql`excluded.full_name`,
          defaultBranch: sql`excluded.default_branch`,
          private: sql`excluded.private`,
          archived: sql`excluded.archived`,
          updatedAt: new Date(),
        },
      }),
  ]);
}

/** The installation row if it exists and belongs to the user. */
export async function findOwnInstallation(userId: string, installationId: number) {
  const [row] = await getDb()
    .select()
    .from(githubInstallation)
    .where(and(eq(githubInstallation.id, installationId), eq(githubInstallation.userId, userId)));
  return row;
}
