import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { z } from "zod";
import { getDb } from "@/db";
import { githubInstallation, githubRepo, taskLink } from "@/db/schema";
import type { LinkState, LinkTargetKind } from "@/lib/domain";
import {
  installationPayloadSchema,
  installationReposPayloadSchema,
  ISSUE_ACTIONS,
  issueLinkState,
  issuePayloadSchema,
  PULL_REQUEST_ACTIONS,
  pullRequestLinkState,
  pullRequestPayloadSchema,
} from "./mapping";
import { syncInstallationRepos } from "./sync";

/** Route a verified webhook event. Unknown events and actions are ignored. Phase 1 never changes tasks. */
export async function handleGithubEvent(event: string, payload: unknown) {
  switch (event) {
    case "installation":
      return onInstallation(installationPayloadSchema.parse(payload));
    case "installation_repositories":
      return onInstallationRepos(installationReposPayloadSchema.parse(payload));
    case "issues": {
      const p = issuePayloadSchema.parse(payload);
      if (!ISSUE_ACTIONS.includes(p.action)) return;
      return updateLinks(
        p.installation.id,
        p.repository.id,
        "issue",
        p.issue.number,
        p.issue.title,
        issueLinkState(p.issue),
      );
    }
    case "pull_request": {
      const p = pullRequestPayloadSchema.parse(payload);
      if (!PULL_REQUEST_ACTIONS.includes(p.action)) return;
      const pr = p.pull_request;
      return updateLinks(
        p.installation.id,
        p.repository.id,
        "pr",
        pr.number,
        pr.title,
        pullRequestLinkState(pr),
      );
    }
    default:
      return;
  }
}

async function findInstallation(installationId: number) {
  const [row] = await getDb()
    .select()
    .from(githubInstallation)
    .where(eq(githubInstallation.id, installationId));
  return row;
}

async function onInstallation(p: z.infer<typeof installationPayloadSchema>) {
  const db = getDb();
  const where = eq(githubInstallation.id, p.installation.id);
  switch (p.action) {
    case "deleted":
      await db.delete(githubInstallation).where(where);
      return;
    case "suspend":
      await db.update(githubInstallation).set({ suspendedAt: new Date() }).where(where);
      return;
    case "unsuspend":
      await db.update(githubInstallation).set({ suspendedAt: null }).where(where);
      return;
    default:
      // "created" is ignored on purpose: the setup callback owns creation (it proves who the owner is).
      return;
  }
}

async function onInstallationRepos(p: z.infer<typeof installationReposPayloadSchema>) {
  const installation = await findInstallation(p.installation.id);
  if (!installation) return;
  if (p.action === "removed") {
    const ids = p.repositories_removed.map((r) => r.id);
    if (!ids.length) return;
    await getDb()
      .delete(githubRepo)
      .where(and(eq(githubRepo.installationId, installation.id), inArray(githubRepo.id, ids)));
    return;
  }
  // The "added" payload lacks default_branch/archived, so re-read the full list from the API.
  if (p.action === "added") await syncInstallationRepos(installation.id, installation.userId);
}

async function updateLinks(
  installationId: number,
  repoId: number,
  kind: LinkTargetKind,
  number: number,
  title: string,
  state: LinkState,
) {
  const db = getDb();
  // Scope: the repo must belong to this installation, and links are matched within its owner.
  const [repo] = await db
    .select({ id: githubRepo.id, userId: githubRepo.userId })
    .from(githubRepo)
    .where(and(eq(githubRepo.id, repoId), eq(githubRepo.installationId, installationId)));
  if (!repo) return;
  await db
    .update(taskLink)
    .set({ title, state, syncedAt: new Date() })
    .where(
      and(
        eq(taskLink.repoId, repo.id),
        eq(taskLink.userId, repo.userId),
        eq(taskLink.kind, kind),
        eq(taskLink.number, number),
      ),
    );
}
