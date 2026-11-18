import type { TaskListQuery } from "./validation";

/** Single source of TanStack Query keys. Invalidate by prefix (e.g. qk.tasks.all). */
export const qk = {
  me: ["me"] as const,
  connections: ["connections"] as const,
  projects: {
    all: ["projects"] as const,
    list: (archived = false) => ["projects", "list", { archived }] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (query: Partial<TaskListQuery> = {}) => ["tasks", "list", query] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
    activity: (id: string) => ["tasks", "activity", id] as const,
  },
  week: {
    all: ["week"] as const,
    plan: (week?: string) => ["week", "plan", week ?? "current"] as const,
    review: (week?: string) => ["week", "review", week ?? "current"] as const,
  },
};
