import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { AppError } from "@/server/errors";
import { assertGithubConfigured } from "@/server/services/github/client";
import {
  linkRepo,
  linkTask,
  listGithubRepos,
  listTaskLinks,
  searchGithub,
  unlinkRepo,
  unlinkTask,
} from "@/server/services/github/links";
import { parseGithubRef } from "@/server/services/github/refs";
import { listProjects } from "@/server/services/projects";
import { mcpActor, toolResult } from "../context";
import { formatTaskLink } from "../format";
import { resolveProject } from "../resolve";

const project = z.string().trim().min(1).max(200);
const repo = z.string().trim().min(1).max(140).describe("Repository as owner/name");
const taskRef = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .describe("GitHub issue/PR/branch URL, owner/repo#12, or owner/repo@branch");

export function registerGithubTools(server: McpServer, userId: string) {
  server.registerTool(
    "list_repos",
    {
      description:
        "List GitHub repositories the Deadlime GitHub App can see, and which projects each is linked to.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () =>
      toolResult(async () => {
        assertGithubConfigured();
        const actor = mcpActor(userId);
        const [{ installations }, projects] = await Promise.all([
          listGithubRepos(actor),
          listProjects(actor, { includeArchived: true }),
        ]);
        return installations.flatMap((i) =>
          i.repos.map((r) => ({
            repo: r.fullName,
            account: i.accountLogin,
            private: r.private,
            archived: r.archived,
            suspended: i.suspended,
            projects: r.projectIds.map((id) => projects.find((p) => p.id === id)?.name ?? id),
          })),
        );
      }),
  );

  server.registerTool(
    "link_repo",
    {
      description:
        "Link a GitHub repository to a project (exact slug, name or id). The GitHub App must already be installed on the repo.",
      inputSchema: z.object({ project, repo }),
    },
    (args) =>
      toolResult(async () => {
        assertGithubConfigured();
        const actor = mcpActor(userId);
        const projects = await listProjects(actor, { includeArchived: true });
        const linked = await linkRepo(actor, resolveProject(projects, args.project), { fullName: args.repo });
        return { linked: linked.fullName, project: args.project };
      }),
  );

  server.registerTool(
    "unlink_repo",
    {
      description: "Remove a repository link from a project. Tasks' own GitHub links are kept.",
      inputSchema: z.object({ project, repo }),
      annotations: { destructiveHint: true },
    },
    (args) =>
      toolResult(async () => {
        assertGithubConfigured();
        const actor = mcpActor(userId);
        const projects = await listProjects(actor, { includeArchived: true });
        const projectId = resolveProject(projects, args.project);
        const { installations } = await listGithubRepos(actor);
        const found = installations
          .flatMap((i) => i.repos)
          .find((r) => r.fullName.toLowerCase() === args.repo.toLowerCase());
        if (!found) throw new AppError("not_found", `Repository "${args.repo}" not found. Use list_repos.`);
        await unlinkRepo(actor, projectId, found.id);
        return { unlinked: found.fullName, project: args.project };
      }),
  );

  server.registerTool(
    "link_task",
    {
      description:
        "Attach a GitHub issue, pull request or branch to a task by exact task id. The repo must be one the GitHub App is installed on.",
      inputSchema: z.object({ id: z.uuid(), ref: taskRef }),
    },
    (args) =>
      toolResult(async () => {
        assertGithubConfigured();
        return formatTaskLink(await linkTask(mcpActor(userId), args.id, args.ref));
      }),
  );

  server.registerTool(
    "unlink_task",
    {
      description:
        "Detach a GitHub issue, pull request or branch from a task, by exact task id and the same ref format as link_task.",
      inputSchema: z.object({ id: z.uuid(), ref: taskRef }),
      annotations: { destructiveHint: true },
    },
    (args) =>
      toolResult(async () => {
        assertGithubConfigured();
        const actor = mcpActor(userId);
        const parsed = parseGithubRef(args.ref);
        if (!parsed)
          throw new AppError(
            "invalid",
            "Use a GitHub issue, PR or branch URL, owner/repo#12, or owner/repo@branch.",
          );
        const fullName = `${parsed.owner}/${parsed.repo}`.toLowerCase();
        const links = await listTaskLinks(actor, args.id);
        const link = links.find((l) => {
          if (l.repo.toLowerCase() !== fullName) return false;
          if (parsed.kind === "branch") return l.kind === "branch" && l.ref === parsed.ref;
          return (
            l.kind !== "branch" &&
            l.number === parsed.number &&
            (parsed.kind === "unknown-number" || l.kind === parsed.kind)
          );
        });
        if (!link) throw new AppError("not_found", "That GitHub link is not on this task.");
        await unlinkTask(actor, args.id, link.id);
        return { unlinked: formatTaskLink(link) };
      }),
  );

  server.registerTool(
    "search_github",
    {
      description:
        "Search issues and pull requests in the connected repositories (a project's linked repos when project is given, otherwise all). Returns hits with the ids of tasks already linked to them.",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(200),
        project: project.optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        assertGithubConfigured();
        const actor = mcpActor(userId);
        const projectId = args.project
          ? resolveProject(await listProjects(actor, { includeArchived: true }), args.project)
          : undefined;
        return searchGithub(actor, { q: args.query, projectId, limit: args.limit });
      }),
  );
}
