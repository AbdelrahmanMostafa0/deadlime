// Shared domain vocabulary. Imported by the DB schema, zod validators,
// services, MCP tools and UI, so every layer agrees on the same values.

export const TASK_STATUSES = ["backlog", "this_week", "doing", "waiting", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  this_week: "This Week",
  doing: "Doing",
  waiting: "Waiting",
  done: "Done",
};

export const PRIORITIES = ["low", "med", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SIZES = ["S", "M", "L"] as const;
export type Size = (typeof SIZES)[number];

export const PROJECT_STATUSES = ["active", "paused", "done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const LINK_KINDS = ["repo", "live", "figma", "social", "other"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const ACTIVITY_SOURCES = ["web", "mcp"] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export const ENTITY_TYPES = ["project", "task", "week_plan"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Built-in automation rule ids, recorded in ActivityLog.rule. */
export const RULES = [
  "done_moves_to_done",
  "undone_returns_to_doing",
  "start_moves_to_doing",
  "first_subtask_starts",
  "due_this_week_moves_to_this_week",
] as const;
export type RuleId = (typeof RULES)[number];

export const DEFAULT_WIP_LIMIT = 3;

/** Statuses that count toward the Doing WIP limit. Waiting is excluded on purpose. */
export const WIP_STATUSES: readonly TaskStatus[] = ["doing"];

export type Subtask = { id: string; title: string; done: boolean };
export type ProjectLink = { kind: LinkKind; url: string; label?: string };

/** Tiptap/ProseMirror JSON document. */
export type RichDoc = { type: "doc"; content?: RichNode[] };
export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export type ReviewSnapshot = {
  done: { id: string; title: string; projectId: string | null }[];
  slipped: { id: string; title: string; projectId: string | null; dueDate: string | null }[];
  carriedOver: { id: string; title: string; projectId: string | null }[];
};

/** Project palette from the Citrus Playground design. */
export const PROJECT_COLORS = [
  "#B8F23A",
  "#FF8A3D",
  "#FF4F9A",
  "#8FD3FF",
  "#C9B8FF",
  "#FFD84D",
] as const;
