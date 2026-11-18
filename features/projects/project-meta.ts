import type { ProjectDTO } from "@/lib/api-types";
import { PROJECT_COLORS, type LinkKind, type ProjectStatus } from "@/lib/domain";

export const STALE_AFTER_DAYS = 14;
const DAY_MS = 86_400_000;

export const STATUS_TEXT: Record<ProjectStatus, string> = { active: "Active", paused: "Paused", done: "Done" };

export const LINK_KIND_TEXT: Record<LinkKind, string> = {
  repo: "Repo",
  live: "Live site",
  figma: "Figma",
  social: "Social",
  other: "Link",
};

/** Active project with no activity for 14+ days. `now` is a ms timestamp so the check stays pure. */
export function isStale(project: Pick<ProjectDTO, "status" | "lastActivityAt">, now: number) {
  if (project.status !== "active") return false;
  return now - new Date(project.lastActivityAt).getTime() >= STALE_AFTER_DAYS * DAY_MS;
}

export function progressPercent(project: Pick<ProjectDTO, "openCount" | "doneCount">) {
  const total = project.openCount + project.doneCount;
  return total === 0 ? 0 : Math.round((project.doneCount / total) * 100);
}

/** `Pharmacy System!` becomes `pharmacy-system`, capped to the 32 char slug limit. */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/, "");
}

export function colorAt(index: number) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
}
