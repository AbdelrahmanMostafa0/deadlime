import type { WeekPlanView } from "@/server/services/week-plans";
import type { Project, Task, TaskLink } from "@/db/schema";
import { docToText } from "@/lib/rich-text";

type ProjectSummary = Pick<Project, "id" | "name" | "slug" | "status" | "archivedAt"> &
  Partial<Pick<Project, "color" | "icon" | "links">>;

export function formatProject(p: ProjectSummary) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    archived: p.archivedAt !== null,
    ...(p.color !== undefined ? { color: p.color } : {}),
    ...(p.icon !== undefined ? { icon: p.icon } : {}),
    ...(p.links !== undefined ? { links: p.links } : {}),
  };
}

type TaskSummary = Pick<Task, "id" | "title" | "status" | "projectId" | "dueDate"> &
  Partial<Pick<Task, "description" | "priority" | "labels" | "size" | "subtasks">> & { score?: number };

export function formatTask(t: TaskSummary, projects: readonly Pick<Project, "id" | "name">[]) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    projectId: t.projectId,
    project: projects.find((p) => p.id === t.projectId)?.name ?? null,
    dueDate: t.dueDate,
    ...(t.description !== undefined ? { description: docToText(t.description) } : {}),
    ...(t.priority !== undefined ? { priority: t.priority } : {}),
    ...(t.labels !== undefined ? { labels: t.labels } : {}),
    ...(t.size !== undefined ? { size: t.size } : {}),
    ...(t.subtasks !== undefined ? { subtasks: t.subtasks } : {}),
    ...(t.score !== undefined ? { score: t.score } : {}),
  };
}

export function jsonResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

export function formatWeekPlan(plan: WeekPlanView, projects: { id: string; name: string }[]) {
  return {
    id: plan.id,
    week: plan.weekStart,
    wipLimit: plan.wipLimit,
    reviewNotes: plan.reviewNotes,
    activeProjects: plan.activeProjectIds.map((id) => ({
      id,
      name: projects.find((p) => p.id === id)?.name ?? null,
    })),
  };
}

type TaskLinkSummary = Pick<TaskLink, "kind" | "number" | "ref" | "title" | "state" | "url"> & { repo: string };

export function formatTaskLink(l: TaskLinkSummary) {
  return {
    kind: l.kind,
    repo: l.repo,
    ...(l.number === null ? { ref: l.ref } : { number: l.number }),
    title: l.title,
    state: l.state,
    url: l.url,
  };
}
