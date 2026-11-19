import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { task, type Task } from "@/db/schema";
import { applyTaskRules, type ResolvedPatch } from "@/lib/automations";
import { addDaysISO, weekEndISO, weekStartISO } from "@/lib/dates";
import { DEFAULT_WIP_LIMIT, type RuleId, type TaskStatus } from "@/lib/domain";
import { fuzzyRank } from "@/lib/fuzzy";
import { docToText } from "@/lib/rich-text";
import {
  taskCreateSchema,
  taskListQuerySchema,
  taskReorderSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskListQuery,
  type TaskReorderInput,
  type TaskUpdateInput,
} from "@/lib/validation";
import type { Actor } from "../api";
import { AppError, notFound } from "../errors";
import { activityInsert, type ActivityEntry } from "./activity";
import { assertOwnProject } from "./projects";
import { getWipLimit } from "./week-plans";

const MAX_TASKS = 5000;
/** Done tasks older than this drop off the board (still in project + review). */
const BOARD_DONE_DAYS = 14;

export type TaskMutationResult = {
  task: Task;
  fired: RuleId[];
  suggestComplete: boolean;
};

const own = (actor: Actor) => and(eq(task.userId, actor.userId), isNull(task.deletedAt));

// ── Reads ──────────────────────────────────────────────────────────

export async function listTasks(actor: Actor, raw: Partial<TaskListQuery> = {}): Promise<Task[]> {
  const q = taskListQuerySchema.parse(raw);
  const where: (SQL | undefined)[] = [own(actor)];
  const weekStart = weekStartISO(actor.today);
  const weekEnd = weekEndISO(actor.today);

  if (q.projectId === "inbox") where.push(isNull(task.projectId));
  else if (q.projectId) where.push(eq(task.projectId, q.projectId));
  if (q.status) where.push(eq(task.status, q.status));
  if (q.dueBefore) where.push(lte(task.dueDate, q.dueBefore));

  switch (q.view) {
    case "today":
      // Due today/overdue, or in progress. Snoozed tasks hide until their date.
      where.push(
        ne(task.status, "done"),
        or(lte(task.dueDate, actor.today), eq(task.status, "doing")),
        or(isNull(task.snoozedUntil), lte(task.snoozedUntil, actor.today)),
      );
      break;
    case "week":
      where.push(
        or(
          inArray(task.status, ["this_week", "doing", "waiting"]),
          and(ne(task.status, "done"), gte(task.dueDate, weekStart), lte(task.dueDate, weekEnd)),
          and(eq(task.status, "done"), gte(task.completedAt, new Date(`${weekStart}T00:00:00Z`))),
        ),
      );
      break;
    case "inbox":
      where.push(isNull(task.projectId), ne(task.status, "done"));
      break;
    case "board":
      where.push(
        or(
          ne(task.status, "done"),
          gte(task.completedAt, new Date(`${addDaysISO(actor.today, -BOARD_DONE_DAYS)}T00:00:00Z`)),
        ),
      );
      break;
    default:
      if (!q.includeDone && !q.status) where.push(ne(task.status, "done"));
  }

  const rows = await getDb()
    .select()
    .from(task)
    .where(and(...where))
    .orderBy(asc(task.status), asc(task.order), desc(task.createdAt))
    .limit(1000);

  return q.q ? fuzzyRank(q.q, rows, (t) => t.title, 50).map((r) => r.item) : rows;
}

export async function getTask(actor: Actor, id: string) {
  const [row] = await getDb()
    .select()
    .from(task)
    .where(and(eq(task.id, id), own(actor)));
  if (!row) throw notFound("Task");
  return row;
}

export type TaskSearchHit = Pick<Task, "id" | "title" | "status" | "projectId" | "dueDate"> & { score: number };

/** Fuzzy title search across all of the user's tasks (done included). */
export async function searchTasks(
  actor: Actor,
  query: string,
  opts: { includeDone?: boolean; limit?: number } = {},
): Promise<TaskSearchHit[]> {
  const rows = await getDb()
    .select({ id: task.id, title: task.title, status: task.status, projectId: task.projectId, dueDate: task.dueDate })
    .from(task)
    .where(and(own(actor), opts.includeDone ? undefined : ne(task.status, "done")));
  return fuzzyRank(query, rows, (t) => t.title, opts.limit ?? 10).map((r) => ({ ...r.item, score: r.score }));
}

export const taskPlainDescription = (t: Pick<Task, "description">) => docToText(t.description);

// ── Writes ─────────────────────────────────────────────────────────

async function assertWip(actor: Actor, from: TaskStatus | null, to: TaskStatus | undefined, force?: boolean) {
  if (force || to !== "doing" || from === "doing") return;
  const db = getDb();
  const [[{ count }], limit] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(task)
      .where(and(own(actor), eq(task.status, "doing"))),
    getWipLimit(actor),
  ]);
  if (count >= limit) {
    throw new AppError("wip_limit", `Doing is full (${count}/${limit}). Finish something, hero.`, { count, limit });
  }
}

async function topOrder(actor: Actor, status: TaskStatus) {
  const [{ min }] = await getDb()
    .select({ min: sql<number | null>`min(${task.order})` })
    .from(task)
    .where(and(own(actor), eq(task.status, status)));
  return (min ?? 1) - 1;
}

function ruleEntries(id: string, fired: RuleId[], from: TaskStatus, to: TaskStatus | undefined): ActivityEntry[] {
  return fired.map((rule) => ({ entityType: "task", entityId: id, action: "moved", rule, meta: { from, to } }));
}

export async function createTask(actor: Actor, raw: TaskCreateInput): Promise<TaskMutationResult> {
  const input = taskCreateSchema.parse(raw);
  await assertOwnProject(actor, input.projectId);
  const db = getDb();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(task)
    .where(own(actor));
  if (count >= MAX_TASKS) throw new AppError("conflict", "Task limit reached. Archive or delete some.");

  // Run the rules as if the fields were set on a fresh backlog task, unless a status was given.
  const explicitStatus = raw.status !== undefined;
  const { patch, fired, suggestComplete } = applyTaskRules(
    { status: input.status, dueDate: null, subtasks: [], startedAt: null, completedAt: null },
    explicitStatus ? { dueDate: input.dueDate } : { dueDate: input.dueDate, subtasks: input.subtasks },
    actor,
  );
  const status = patch.status ?? input.status;
  await assertWip(actor, null, status);

  const id = crypto.randomUUID();
  const [[created]] = await db.batch([
    db
      .insert(task)
      .values({
        ...input,
        id,
        userId: actor.userId,
        status,
        order: await topOrder(actor, status),
        startedAt: patch.startedAt ?? null,
        completedAt: patch.completedAt ?? null,
      })
      .returning(),
    activityInsert(db, actor, [
      { entityType: "task", entityId: id, action: "created", meta: { status } },
      ...ruleEntries(id, fired, input.status, status),
    ]),
  ]);
  return { task: created, fired, suggestComplete };
}

export async function updateTask(actor: Actor, id: string, raw: TaskUpdateInput): Promise<TaskMutationResult> {
  const { force, ...input } = taskUpdateSchema.parse(raw);
  const before = await getTask(actor, id);
  if (input.projectId !== undefined) await assertOwnProject(actor, input.projectId);

  const { patch, fired, suggestComplete } = applyTaskRules(before, input, actor);
  await assertWip(actor, before.status, patch.status, force);

  const values: ResolvedPatch & { order?: number } = { ...patch };
  if (patch.status && patch.status !== before.status) values.order = await topOrder(actor, patch.status);

  const db = getDb();
  const action =
    patch.status === "done" && before.status !== "done"
      ? "completed"
      : before.status === "done" && patch.status && patch.status !== "done"
        ? "reopened"
        : patch.status && patch.status !== before.status
          ? "moved"
          : "updated";

  const [[updated]] = await db.batch([
    db
      .update(task)
      .set(values)
      .where(and(eq(task.id, id), own(actor)))
      .returning(),
    activityInsert(db, actor, [
      ...(fired.length
        ? ruleEntries(id, fired, before.status, patch.status)
        : [
            {
              entityType: "task" as const,
              entityId: id,
              action,
              meta: { fields: Object.keys(raw), from: before.status, to: patch.status ?? before.status },
            },
          ]),
    ]),
  ]);
  return { task: updated, fired, suggestComplete };
}

/** Drag and drop: move a task into `status` and persist the column's order. */
export async function reorderTasks(actor: Actor, raw: TaskReorderInput): Promise<TaskMutationResult> {
  const input = taskReorderSchema.parse(raw);
  if (!input.orderedIds.includes(input.taskId)) throw new AppError("invalid", "orderedIds must include taskId.");
  const before = await getTask(actor, input.taskId);
  const statusChanged = before.status !== input.status;

  const { patch, fired, suggestComplete } = statusChanged
    ? applyTaskRules(before, { status: input.status }, actor)
    : { patch: {}, fired: [] as RuleId[], suggestComplete: false };
  await assertWip(actor, before.status, statusChanged ? input.status : undefined, input.force);

  const db = getDb();
  const currentOrders = await db
    .select({ id: task.id, order: task.order })
    .from(task)
    .where(and(inArray(task.id, input.orderedIds), own(actor)));
  const orderById = new Map(currentOrders.map((row) => [row.id, row.order]));
  const moveUpdate = db
    .update(task)
    .set({ ...patch, order: input.orderedIds.indexOf(input.taskId) })
    .where(and(eq(task.id, input.taskId), own(actor)))
    .returning();
  const reorderUpdates = input.orderedIds.flatMap((id, index) =>
    id === input.taskId || orderById.get(id) === index
      ? []
      : [
          db
            .update(task)
            .set({ order: index })
            .where(and(eq(task.id, id), own(actor), eq(task.status, input.status)))
            .returning(),
        ],
  );
  const results = await db.batch([
    moveUpdate,
    ...reorderUpdates,
    activityInsert(db, actor, [
      ...ruleEntries(input.taskId, fired, before.status, input.status),
      {
        entityType: "task",
        entityId: input.taskId,
        action: statusChanged ? (input.status === "done" ? "completed" : "moved") : "reordered",
        meta: { from: before.status, to: input.status },
      },
    ]),
  ]);
  // The moved task's update is always first in the batch.
  const [moved] = results[0] as Task[];
  if (!moved) throw notFound("Task");
  return { task: moved, fired, suggestComplete };
}

export async function deleteTask(actor: Actor, id: string) {
  await getTask(actor, id);
  const db = getDb();
  await db.batch([
    db
      .update(task)
      .set({ deletedAt: actor.now })
      .where(and(eq(task.id, id), eq(task.userId, actor.userId))),
    activityInsert(db, actor, [{ entityType: "task", entityId: id, action: "deleted" }]),
  ]);
}

/** Undo for delete. */
export async function restoreTask(actor: Actor, id: string) {
  const db = getDb();
  const [[restored]] = await db.batch([
    db
      .update(task)
      .set({ deletedAt: null })
      .where(and(eq(task.id, id), eq(task.userId, actor.userId), isNotNull(task.deletedAt)))
      .returning(),
    activityInsert(db, actor, [{ entityType: "task", entityId: id, action: "restored" }]),
  ]);
  if (!restored) throw notFound("Task");
  return restored;
}

export { DEFAULT_WIP_LIMIT };
