import { z } from "zod";
import {
  LINK_KINDS,
  PRIORITIES,
  PROJECT_STATUSES,
  SIZES,
  TASK_STATUSES,
  type RichDoc,
  type RichNode,
} from "./domain";

// Boundary validators shared by REST route handlers, MCP tools and client forms.
// Every string/array has an upper bound: sign-up is open, so payloads must be capped.

const isoDate = z.iso.date();
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #RRGGBB color");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, numbers and dashes");

export const projectLinkSchema = z.object({
  kind: z.enum(LINK_KINDS),
  url: z.url().max(2048),
  label: z.string().trim().max(60).optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(60),
  slug: slugSchema.optional(),
  color: hexColor,
  icon: z.string().trim().min(1).max(40).default("folder"),
  status: z.enum(PROJECT_STATUSES).default("active"),
  links: z.array(projectLinkSchema).max(12).default([]),
  notes: z.string().max(20_000).default(""),
});
export type ProjectCreateInput = z.input<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema
  .partial()
  .extend({ archived: z.boolean().optional() });
export type ProjectUpdateInput = z.input<typeof projectUpdateSchema>;

const richNode: z.ZodType<RichNode, RichNode> = z.lazy(() =>
  z.object({
    type: z.string().max(40),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(richNode).max(2000).optional(),
    marks: z
      .array(z.object({ type: z.string().max(40), attrs: z.record(z.string(), z.unknown()).optional() }))
      .max(20)
      .optional(),
    text: z.string().max(20_000).optional(),
  }),
);

export const richDocSchema = z
  .object({ type: z.literal("doc"), content: z.array(richNode).max(2000).optional() })
  .refine((d) => JSON.stringify(d).length <= 200_000, "Description is too long")
  .transform((d) => d as RichDoc);

export const subtaskSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().trim().min(1).max(200),
  done: z.boolean(),
});

const label = z.string().trim().toLowerCase().min(1).max(30);

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "A task needs a title").max(200),
  projectId: z.uuid().nullable().default(null),
  description: richDocSchema.nullable().default(null),
  status: z.enum(TASK_STATUSES).default("backlog"),
  priority: z.enum(PRIORITIES).default("med"),
  labels: z.array(label).max(12).default([]),
  dueDate: isoDate.nullable().default(null),
  size: z.enum(SIZES).nullable().default(null),
  subtasks: z.array(subtaskSchema).max(50).default([]),
});
export type TaskCreateInput = z.input<typeof taskCreateSchema>;

export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    projectId: z.uuid().nullable(),
    description: richDocSchema.nullable(),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(PRIORITIES),
    labels: z.array(label).max(12),
    dueDate: isoDate.nullable(),
    size: z.enum(SIZES).nullable(),
    subtasks: z.array(subtaskSchema).max(50),
    snoozedUntil: isoDate.nullable(),
    completed: z.boolean(),
    start: z.boolean(),
    /** Skip the WIP limit check ("I know, I know"). */
    force: z.boolean(),
  })
  .partial();
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;

export const taskReorderSchema = z.object({
  /** Task being moved. */
  taskId: z.uuid(),
  /** Destination column. */
  status: z.enum(TASK_STATUSES),
  /** Full ordered id list of the destination column after the move. */
  orderedIds: z.array(z.uuid()).max(500),
  force: z.boolean().optional(),
});
export type TaskReorderInput = z.input<typeof taskReorderSchema>;

export const taskListQuerySchema = z.object({
  projectId: z.union([z.uuid(), z.literal("inbox")]).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  view: z.enum(["today", "week", "inbox", "board"]).optional(),
  dueBefore: isoDate.optional(),
  q: z.string().trim().max(200).optional(),
  includeDone: z.coerce.boolean().optional(),
});
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

export const weekPlanUpdateSchema = z
  .object({
    activeProjectIds: z.array(z.uuid()).max(50),
    wipLimit: z.number().int().min(1).max(10),
    reviewNotes: z.string().max(20_000),
  })
  .partial();
export type WeekPlanUpdateInput = z.input<typeof weekPlanUpdateSchema>;

export const weekReviewSchema = z.object({
  reviewNotes: z.string().max(20_000).default(""),
  /** Not-done tasks to carry into next week (moved to This Week). */
  carryOverIds: z.array(z.uuid()).max(500).default([]),
  /** Not-done tasks to drop back to Backlog. */
  dropIds: z.array(z.uuid()).max(500).default([]),
});
export type WeekReviewInput = z.input<typeof weekReviewSchema>;
