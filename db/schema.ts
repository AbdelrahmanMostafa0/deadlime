import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ACTIVITY_SOURCES,
  ENTITY_TYPES,
  LINK_STATES,
  LINK_TARGET_KINDS,
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
export const taskLinkKind = pgEnum("task_link_kind", LINK_TARGET_KINDS);
export const taskLinkState = pgEnum("task_link_state", LINK_STATES);

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

/** A GitHub App installation a user connected. The id is GitHub's installation id. */
export const githubInstallation = pgTable("github_installation", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  userId: owner(),
  accountLogin: text("account_login").notNull(),
  accountType: text("account_type").notNull(),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  ...timestamps,
});

/** A repository the installation can see. The id is GitHub's repository id. */
export const githubRepo = pgTable(
  "github_repo",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    installationId: bigint("installation_id", { mode: "number" })
      .notNull()
      .references(() => githubInstallation.id, { onDelete: "cascade" }),
    userId: owner(),
    fullName: text("full_name").notNull(),
    defaultBranch: text("default_branch").notNull(),
    private: boolean("private").notNull(),
    archived: boolean("archived").notNull(),
    ...timestamps,
  },
  (t) => [
    index("github_repo_user_idx").on(t.userId),
    unique("github_repo_user_name_uq").on(t.userId, t.fullName),
  ],
);

export const projectRepo = pgTable(
  "project_repo",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    repoId: bigint("repo_id", { mode: "number" })
      .notNull()
      .references(() => githubRepo.id, { onDelete: "cascade" }),
    userId: owner(),
    importIssues: boolean("import_issues").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.repoId] })],
);

export const taskLink = pgTable(
  "task_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    repoId: bigint("repo_id", { mode: "number" })
      .notNull()
      .references(() => githubRepo.id, { onDelete: "cascade" }),
    kind: taskLinkKind("kind").notNull(),
    /** Issue / PR number. Null for branches. */
    number: integer("number"),
    /** Branch name. Null for issues and PRs. */
    ref: text("ref"),
    url: text("url").notNull(),
    title: text("title").notNull(),
    state: taskLinkState("state").notNull(),
    ciStatus: text("ci_status"),
    drift: boolean("drift").notNull().default(false),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("task_link_target_uq").on(t.taskId, t.repoId, t.kind, t.number, t.ref).nullsNotDistinct(),
    index("task_link_repo_kind_number_idx").on(t.repoId, t.kind, t.number),
  ],
);

/** Webhook deliveries already handled, so GitHub retries are no-ops. */
export const githubDelivery = pgTable("github_delivery", {
  id: text("id").primaryKey(),
  event: text("event").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GithubInstallation = typeof githubInstallation.$inferSelect;
export type GithubRepo = typeof githubRepo.$inferSelect;
export type TaskLink = typeof taskLink.$inferSelect;
export type Project = typeof project.$inferSelect;
export type Task = typeof task.$inferSelect;
export type WeekPlan = typeof weekPlan.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
