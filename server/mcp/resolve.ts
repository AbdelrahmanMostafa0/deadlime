import type { Project } from "@/db/schema";
import { AppError } from "@/server/errors";

type ProjectIdentity = Pick<Project, "id" | "slug" | "name">;

/** Resolve only exact identities in an already user-scoped collection. Never guess. */
export function resolveProject(projects: readonly ProjectIdentity[], reference: string): string {
  const wanted = reference.trim().toLowerCase();
  const byId = projects.find((p) => p.id.toLowerCase() === wanted);
  if (byId) return byId.id;
  const matches = projects.filter((p) => p.slug.toLowerCase() === wanted || p.name.toLowerCase() === wanted);
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1)
    throw new AppError("invalid", `Ambiguous project "${reference}". Use a project id.`, { matches });
  throw new AppError("not_found", `Project "${reference}" not found. Use list_projects to find its id.`);
}
