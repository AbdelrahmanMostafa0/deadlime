import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { githubInstallation, githubRepo, projectRepo, task, taskLink } from "@/db/schema";
import type { GithubReposDTO, GithubSearchHitDTO, ProjectRepoDTO, TaskLinkDTO } from "@/lib/api-types";
import type { LinkState, LinkTargetKind } from "@/lib/domain";
import type { GithubSearchQuery } from "@/lib/validation";
import type { Actor } from "../../api";
import { AppError, notFound } from "../../errors";
import { activityInsert } from "../activity";
import { getProject } from "../projects";
import { getTask } from "../tasks";
import { githubData, installationOctokit } from "./client";
import { issueLinkState, pullRequestLinkState } from "./mapping";
import { parseGithubRef } from "./refs";

const SEARCH_REPOS_PER_REQUEST = 20;
const DEFAULT_SEARCH_LIMIT = 20;

const repoColumns = {
  id: githubRepo.id,
  fullName: githubRepo.fullName,
  defaultBranch: githubRepo.defaultBranch,
  private: githubRepo.private,
  archived: githubRepo.archived,
};

const repoByName = (actor: Actor, fullName: string) =>
  and(eq(githubRepo.userId, actor.userId), sql`lower(${githubRepo.fullName}) = ${fullName.toLowerCase()}`);

// ── Repos ──────────────────────────────────────────────────────────

export async function listGithubRepos(actor: Actor): Promise<GithubReposDTO> {
  const db = getDb();
  const [installations, repos, links] = await Promise.all([
    db
      .select()
      .from(githubInstallation)
      .where(eq(githubInstallation.userId, actor.userId))
      .orderBy(asc(githubInstallation.accountLogin)),
    db
      .select({ ...repoColumns, installationId: githubRepo.installationId })
      .from(githubRepo)
      .where(eq(githubRepo.userId, actor.userId))
      .orderBy(asc(githubRepo.fullName)),
    db
      .select({ projectId: projectRepo.projectId, repoId: projectRepo.repoId })
      .from(projectRepo)
      .where(eq(projectRepo.userId, actor.userId)),
  ]);
  return {
    installations: installations.map((i) => ({
      id: i.id,
      accountLogin: i.accountLogin,
      accountType: i.accountType,
      suspended: i.suspendedAt !== null,
      repos: repos
        .filter((r) => r.installationId === i.id)
        .map((r) => ({
          id: r.id,
          fullName: r.fullName,
          defaultBranch: r.defaultBranch,
          private: r.private,
          archived: r.archived,
          projectIds: links.filter((l) => l.repoId === r.id).map((l) => l.projectId),
        })),
    })),
  };
}

export async function listProjectRepos(actor: Actor, projectId: string): Promise<ProjectRepoDTO[]> {
  await getProject(actor, projectId);
  return getDb()
    .select({ ...repoColumns, importIssues: projectRepo.importIssues })
    .from(projectRepo)
    .innerJoin(githubRepo, eq(githubRepo.id, projectRepo.repoId))
    .where(
      and(
        eq(projectRepo.projectId, projectId),
        eq(projectRepo.userId, actor.userId),
        eq(githubRepo.userId, actor.userId),
      ),
    )
    .orderBy(asc(githubRepo.fullName));
}

export async function linkRepo(
  actor: Actor,
  projectId: string,
  target: { repoId: number } | { fullName: string },
): Promise<ProjectRepoDTO> {
  await getProject(actor, projectId);
  const db = getDb();
  const [repo] = await db
    .select(repoColumns)
    .from(githubRepo)
    .where(
      "repoId" in target
        ? and(eq(githubRepo.userId, actor.userId), eq(githubRepo.id, target.repoId))
        : repoByName(actor, target.fullName),
    );
  if (!repo) {
    if ("fullName" in target)
      throw new AppError("invalid", `Install the GitHub App on ${target.fullName} first.`);
    throw notFound("Repository");
  }
  await db
    .insert(projectRepo)
    .values({ projectId, repoId: repo.id, userId: actor.userId })
    .onConflictDoNothing();
  const [row] = await db
    .select({ importIssues: projectRepo.importIssues })
    .from(projectRepo)
    .where(
      and(
        eq(projectRepo.projectId, projectId),
        eq(projectRepo.repoId, repo.id),
        eq(projectRepo.userId, actor.userId),
      ),
    );
  return { ...repo, importIssues: row?.importIssues ?? false };
}

export async function unlinkRepo(actor: Actor, projectId: string, repoId: number) {
  await getProject(actor, projectId);
  await getDb()
    .delete(projectRepo)
    .where(
      and(
        eq(projectRepo.projectId, projectId),
        eq(projectRepo.repoId, repoId),
        eq(projectRepo.userId, actor.userId),
      ),
    );
}

// ── Task links ─────────────────────────────────────────────────────

const linkColumns = {
  id: taskLink.id,
  taskId: taskLink.taskId,
  repoId: taskLink.repoId,
  kind: taskLink.kind,
  number: taskLink.number,
  ref: taskLink.ref,
  url: taskLink.url,
  title: taskLink.title,
  state: taskLink.state,
  ciStatus: taskLink.ciStatus,
  drift: taskLink.drift,
  syncedAt: taskLink.syncedAt,
  createdAt: taskLink.createdAt,
  repo: githubRepo.fullName,
};

export async function listTaskLinks(actor: Actor, taskId: string): Promise<TaskLinkDTO[]> {
  await getTask(actor, taskId);
  const rows = await getDb()
    .select(linkColumns)
    .from(taskLink)
    .innerJoin(githubRepo, eq(githubRepo.id, taskLink.repoId))
    .where(and(eq(taskLink.taskId, taskId), eq(taskLink.userId, actor.userId)))
    .orderBy(asc(taskLink.createdAt));
  return rows.map((r) => ({
    ...r,
    syncedAt: r.syncedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

const issueSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  state: z.string(),
  pull_request: z.object({}).passthrough().optional(),
});
const pullSchema = z.object({
  title: z.string(),
  state: z.string(),
  merged: z.boolean().optional(),
  draft: z.boolean().optional(),
});
const branchSchema = z.object({ name: z.string() });

type Target = {
  kind: LinkTargetKind;
  number: number | null;
  ref: string | null;
  title: string;
  state: LinkState;
};

type Octokit = Awaited<ReturnType<typeof installationOctokit>>;

async function fetchTarget(
  octokit: Octokit,
  owner: string,
  repo: string,
  parsed: NonNullable<ReturnType<typeof parseGithubRef>>,
): Promise<Target> {
  if (parsed.kind === "branch") {
    const branch = await githubData(
      octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", { owner, repo, branch: parsed.ref }),
      branchSchema,
    );
    return { kind: "branch", number: null, ref: branch.name, title: branch.name, state: "open" };
  }
  const issue = await githubData(
    octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}", {
      owner,
      repo,
      issue_number: parsed.number,
    }),
    issueSchema,
  );
  if (!issue.pull_request)
    return {
      kind: "issue",
      number: issue.number,
      ref: null,
      title: issue.title,
      state: issueLinkState(issue),
    };
  const pull = await githubData(
    octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: issue.number,
    }),
    pullSchema,
  );
  return {
    kind: "pr",
    number: issue.number,
    ref: null,
    title: pull.title,
    state: pullRequestLinkState(pull),
  };
}

/** Canonical URL built from our own data, never from user input. */
function targetUrl(fullName: string, target: Target) {
  if (target.kind === "branch")
    return `https://github.com/${fullName}/tree/${(target.ref ?? "").split("/").map(encodeURIComponent).join("/")}`;
  return `https://github.com/${fullName}/${target.kind === "pr" ? "pull" : "issues"}/${target.number}`;
}

const activityMeta = (link: {
  url: string;
  kind: LinkTargetKind;
  number: number | null;
  ref: string | null;
}) => ({
  url: link.url,
  kind: link.kind,
  ...(link.number === null ? { ref: link.ref } : { number: link.number }),
});

export async function linkTask(actor: Actor, taskId: string, input: string): Promise<TaskLinkDTO> {
  await getTask(actor, taskId);
  const parsed = parseGithubRef(input);
  if (!parsed)
    throw new AppError(
      "invalid",
      "Use a GitHub issue, PR or branch URL, owner/repo#12, or owner/repo@branch.",
    );
  const wanted = `${parsed.owner}/${parsed.repo}`;
  const db = getDb();
  const [repo] = await db
    .select({
      id: githubRepo.id,
      fullName: githubRepo.fullName,
      installationId: githubRepo.installationId,
      suspendedAt: githubInstallation.suspendedAt,
    })
    .from(githubRepo)
    .innerJoin(githubInstallation, eq(githubInstallation.id, githubRepo.installationId))
    .where(repoByName(actor, wanted));
  if (!repo) throw new AppError("invalid", `Install the GitHub App on ${wanted} first.`);
  if (repo.suspendedAt) throw new AppError("invalid", `The GitHub App is suspended for ${repo.fullName}.`);

  const octokit = await installationOctokit(repo.installationId);
  const target = await fetchTarget(octokit, parsed.owner, parsed.repo, parsed);
  const url = targetUrl(repo.fullName, target);

  const sameTarget = and(
    eq(taskLink.taskId, taskId),
    eq(taskLink.userId, actor.userId),
    eq(taskLink.repoId, repo.id),
    eq(taskLink.kind, target.kind),
    target.number === null ? isNull(taskLink.number) : eq(taskLink.number, target.number),
    target.ref === null ? isNull(taskLink.ref) : eq(taskLink.ref, target.ref),
  );
  const [existing] = await db.select({ id: taskLink.id }).from(taskLink).where(sameTarget);
  let linkId = existing?.id;
  if (!linkId) {
    const [[created]] = await db.batch([
      db
        .insert(taskLink)
        .values({
          userId: actor.userId,
          taskId,
          repoId: repo.id,
          kind: target.kind,
          number: target.number,
          ref: target.ref,
          url,
          title: target.title,
          state: target.state,
          syncedAt: actor.now,
        })
        .onConflictDoNothing()
        .returning({ id: taskLink.id }),
      activityInsert(db, actor, [
        {
          entityType: "task",
          entityId: taskId,
          action: "linked",
          meta: activityMeta({ url, kind: target.kind, number: target.number, ref: target.ref }),
        },
      ]),
    ]);
    linkId = created?.id;
    if (!linkId) linkId = (await db.select({ id: taskLink.id }).from(taskLink).where(sameTarget))[0]?.id;
  }
  const link = (await listTaskLinks(actor, taskId)).find((l) => l.id === linkId);
  if (!link) throw notFound("Link");
  return link;
}

export async function unlinkTask(actor: Actor, taskId: string, linkId: string) {
  await getTask(actor, taskId);
  const db = getDb();
  const [link] = await db
    .select({ url: taskLink.url, kind: taskLink.kind, number: taskLink.number, ref: taskLink.ref })
    .from(taskLink)
    .where(and(eq(taskLink.id, linkId), eq(taskLink.taskId, taskId), eq(taskLink.userId, actor.userId)));
  if (!link) throw notFound("Link");
  await db.batch([
    db.delete(taskLink).where(and(eq(taskLink.id, linkId), eq(taskLink.userId, actor.userId))),
    activityInsert(db, actor, [
      { entityType: "task", entityId: taskId, action: "unlinked", meta: activityMeta(link) },
    ]),
  ]);
}

// ── Search ─────────────────────────────────────────────────────────

const searchSchema = z.object({
  items: z.array(
    z.object({
      number: z.number().int(),
      title: z.string(),
      state: z.string(),
      updated_at: z.string(),
      repository_url: z.string(),
      draft: z.boolean().optional(),
      pull_request: z.object({ merged_at: z.string().nullable().optional() }).passthrough().optional(),
    }),
  ),
});

/** Free text only: users must not widen the search to other repos with repo:/org:/user: qualifiers. */
function sanitizeQuery(query: string) {
  return query
    .split(/\s+/)
    .filter((word) => word && !/^-?(repo|org|user|owner):/i.test(word))
    .join(" ");
}

export async function searchGithub(
  actor: Actor,
  { q, projectId, limit = DEFAULT_SEARCH_LIMIT }: GithubSearchQuery,
): Promise<GithubSearchHitDTO[]> {
  const text = sanitizeQuery(q);
  if (!text) throw new AppError("invalid", "Enter some search text.");
  if (projectId) await getProject(actor, projectId);
  const db = getDb();

  const base = db
    .select({ id: githubRepo.id, fullName: githubRepo.fullName, installationId: githubRepo.installationId })
    .from(githubRepo)
    .innerJoin(githubInstallation, eq(githubInstallation.id, githubRepo.installationId));
  const notSuspended = isNull(githubInstallation.suspendedAt);
  const repos = projectId
    ? await base
        .innerJoin(projectRepo, eq(projectRepo.repoId, githubRepo.id))
        .where(
          and(
            eq(githubRepo.userId, actor.userId),
            eq(projectRepo.projectId, projectId),
            eq(projectRepo.userId, actor.userId),
            notSuspended,
          ),
        )
    : await base.where(and(eq(githubRepo.userId, actor.userId), notSuspended));
  if (!repos.length) return [];

  const byName = new Map(repos.map((r) => [r.fullName.toLowerCase(), r]));
  const byInstallation = Map.groupBy(repos, (r) => r.installationId);
  const requests = [...byInstallation].flatMap(([installationId, group]) =>
    chunk(group, SEARCH_REPOS_PER_REQUEST).map(async (part) => {
      const octokit = await installationOctokit(installationId);
      const query = `${text} ${part.map((r) => `repo:${r.fullName}`).join(" ")}`;
      return githubData(
        octokit.request("GET /search/issues", { q: query, sort: "updated", order: "desc", per_page: limit }),
        searchSchema,
      );
    }),
  );
  const items = (await Promise.all(requests)).flatMap((r) => r.items);
  items.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

  const hits = items.flatMap((item) => {
    const repo = byName.get(item.repository_url.replace(/^.*\/repos\//, "").toLowerCase());
    if (!repo) return [];
    const kind: "issue" | "pr" = item.pull_request ? "pr" : "issue";
    const state: LinkState = item.pull_request
      ? pullRequestLinkState({
          state: item.state,
          merged: Boolean(item.pull_request.merged_at),
          draft: item.draft,
        })
      : issueLinkState(item);
    return [{ repoId: repo.id, repo: repo.fullName, kind, number: item.number, title: item.title, state }];
  });
  const top = hits.slice(0, limit);
  if (!top.length) return [];

  const linked = await db
    .select({
      taskId: taskLink.taskId,
      repoId: taskLink.repoId,
      kind: taskLink.kind,
      number: taskLink.number,
    })
    .from(taskLink)
    .innerJoin(task, and(eq(task.id, taskLink.taskId), isNull(task.deletedAt)))
    .where(
      and(
        eq(taskLink.userId, actor.userId),
        inArray(taskLink.repoId, [...new Set(top.map((h) => h.repoId))]),
        inArray(taskLink.number, [...new Set(top.map((h) => h.number))]),
      ),
    );
  return top.map(({ repoId, ...hit }) => ({
    ...hit,
    url: targetUrl(hit.repo, {
      kind: hit.kind,
      number: hit.number,
      ref: null,
      title: hit.title,
      state: hit.state,
    }),
    linkedTaskIds: linked
      .filter((l) => l.repoId === repoId && l.kind === hit.kind && l.number === hit.number)
      .map((l) => l.taskId),
  }));
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
