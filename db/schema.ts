import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ACTIVITY_SOURCES,
  ENTITY_TYPES,
  PRIORITIES,
  PROJECT_STATUSES,
  SIZES,
  TASK_STATUSES,
  type ProjectLink,
  type ReviewSnapshot,
  type RichDoc,
  type Subtask,
} from "@/lib/domain";
import { user } from "./auth-schema";

export * from "./auth-schema";
export * from "./oauth-schema";

export const taskStatus = pgEnum("task_status", TASK_STATUSES);
export const priority = pgEnum("priority", PRIORITIES);
export const size = pgEnum("size", SIZES);
export const projectStatus = pgEnum("project_status", PROJECT_STATUSES);
export const activitySource = pgEnum("activity_source", ACTIVITY_SOURCES);
export const entityType = pgEnum("entity_type", ENTITY_TYPES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const owner = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const project = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    name: text("name").notNull(),
    /** Short handle used by quick capture: `#pharmacy`. Unique per user. */
    slug: text("slug").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull().default("folder"),
    status: projectStatus("status").notNull().default("active"),
    links: jsonb("links").$type<ProjectLink[]>().notNull().default(sql`'[]'::jsonb`),
    notes: text("notes").notNull().default(""),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("project_user_idx").on(t.userId),
    uniqueIndex("project_user_slug_uq").on(t.userId, t.slug),
  ],
);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    /** Null = Inbox (captured without a project). */
    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    /** Tiptap document JSON (canonical). Plain text is derived on read for MCP/search. */
    description: jsonb("description").$type<RichDoc | null>(),
    status: taskStatus("status").notNull().default("backlog"),
    priority: priority("priority").notNull().default("med"),
    labels: jsonb("labels").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    dueDate: date("due_date", { mode: "string" }),
    size: size("size"),
    subtasks: jsonb("subtasks").$type<Subtask[]>().notNull().default(sql`'[]'::jsonb`),
    /** Integer position inside a status column; a move reindexes the column. */
    order: integer("order").notNull().default(0),
    /** Snoozed tasks are hidden from Today until this date. */
    snoozedUntil: date("snoozed_until", { mode: "string" }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Soft delete so "Undo" can restore. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("task_user_status_order_idx").on(t.userId, t.status, t.order),
    index("task_user_project_idx").on(t.userId, t.projectId),
    index("task_user_due_idx").on(t.userId, t.dueDate),
  ],
);

export const weekPlan = pgTable(
  "week_plan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    /** Monday of the week, ISO date. */
    weekStart: date("week_start", { mode: "string" }).notNull(),
    activeProjectIds: uuid("active_project_ids").array().notNull().default(sql`'{}'::uuid[]`),
    wipLimit: integer("wip_limit").notNull().default(3),
    reviewNotes: text("review_notes").notNull().default(""),
    /** Frozen at review time so history survives later edits. */
    reviewSnapshot: jsonb("review_snapshot").$type<ReviewSnapshot | null>(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("week_plan_user_week_uq").on(t.userId, t.weekStart)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    entityType: entityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    /** e.g. created, updated, moved, completed, reopened, deleted, restored. */
    action: text("action").notNull(),
    source: activitySource("source").notNull().default("web"),
    /** Automation rule that caused the change, if any. */
    rule: text("rule"),
    /** Small diff payload: { from, to } per changed field. */
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_entity_idx").on(t.entityType, t.entityId, t.createdAt),
    index("activity_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export type Project = typeof project.$inferSelect;
export type Task = typeof task.$inferSelect;
export type WeekPlan = typeof weekPlan.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
