import "server-only";
import { and, eq, gte, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { project, task, weekPlan, type WeekPlan } from "@/db/schema";
import { addDaysISO, weekEndISO, weekStartISO, type ISODate } from "@/lib/dates";
import { DEFAULT_WIP_LIMIT, type ReviewSnapshot } from "@/lib/domain";
import {
  weekPlanUpdateSchema,
  weekReviewSchema,
  type WeekPlanUpdateInput,
  type WeekReviewInput,
} from "@/lib/validation";
import type { Actor } from "../api";
import { AppError } from "../errors";
import { activityInsert } from "./activity";

/** A plan that hasn't been saved yet is returned with id null. */
export type WeekPlanView = Omit<WeekPlan, "id"> & { id: string | null };

function emptyPlan(actor: Actor, weekStart: ISODate): WeekPlanView {
  return {
    id: null,
    userId: actor.userId,
    weekStart,
    activeProjectIds: [],
    wipLimit: DEFAULT_WIP_LIMIT,
    reviewNotes: "",
    reviewSnapshot: null,
    reviewedAt: null,
    createdAt: actor.now,
    updatedAt: actor.now,
  };
}

export async function getWeekPlan(actor: Actor, week?: ISODate): Promise<WeekPlanView> {
  const weekStart = weekStartISO(week ?? actor.today);
  const [row] = await getDb()
    .select()
    .from(weekPlan)
    .where(and(eq(weekPlan.userId, actor.userId), eq(weekPlan.weekStart, weekStart)));
  return row ?? emptyPlan(actor, weekStart);
}

export async function getWipLimit(actor: Actor) {
  return (await getWeekPlan(actor)).wipLimit;
}

async function assertOwnProjects(actor: Actor, ids: string[]) {
  if (!ids.length) return;
  const rows = await getDb()
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.userId, actor.userId), inArray(project.id, ids)));
  if (rows.length !== new Set(ids).size) throw new AppError("invalid", "Unknown project in focus list.");
}

export async function setWeekPlan(actor: Actor, raw: WeekPlanUpdateInput, week?: ISODate) {
  const input = weekPlanUpdateSchema.parse(raw);
  if (input.activeProjectIds) await assertOwnProjects(actor, input.activeProjectIds);
  const weekStart = weekStartISO(week ?? actor.today);
  const db = getDb();
  const [saved] = await db
    .insert(weekPlan)
    .values({ userId: actor.userId, weekStart, ...input })
    .onConflictDoUpdate({ target: [weekPlan.userId, weekPlan.weekStart], set: input })
    .returning();
  await activityInsert(db, actor, [
    { entityType: "week_plan", entityId: saved.id, action: "updated", meta: { fields: Object.keys(raw) } },
  ]);
  return saved;
}

export type WeekReviewSummary = {
  weekStart: ISODate;
  weekEnd: ISODate;
  plan: WeekPlanView;
  done: ReviewSnapshot["done"];
  slipped: ReviewSnapshot["slipped"];
  /** Not done and still on this week's plate: candidates for carry-over. */
  open: { id: string; title: string; projectId: string | null; status: string; dueDate: string | null }[];
};

/** Live numbers for the Sunday review screen. */
export async function getWeekReview(actor: Actor, week?: ISODate): Promise<WeekReviewSummary> {
  const weekStart = weekStartISO(week ?? actor.today);
  const weekEnd = weekEndISO(weekStart);
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(`${addDaysISO(weekEnd, 1)}T00:00:00Z`);
  const db = getDb();
  const own = and(eq(task.userId, actor.userId), isNull(task.deletedAt));
  const cols = { id: task.id, title: task.title, projectId: task.projectId, status: task.status, dueDate: task.dueDate };

  const [plan, done, slipped, open] = await Promise.all([
    getWeekPlan(actor, weekStart),
    db
      .select(cols)
      .from(task)
      .where(and(own, eq(task.status, "done"), gte(task.completedAt, start), lte(task.completedAt, end))),
    db
      .select(cols)
      .from(task)
      .where(
        and(
          own,
          gte(task.dueDate, weekStart),
          lte(task.dueDate, weekEnd),
          or(ne(task.status, "done"), sql`${task.completedAt} >= ${end}`),
        ),
      ),
    db
      .select(cols)
      .from(task)
      .where(and(own, inArray(task.status, ["this_week", "doing", "waiting"]))),
  ]);

  return {
    weekStart,
    weekEnd,
    plan,
    done: done.map(({ id, title, projectId }) => ({ id, title, projectId })),
    slipped: slipped.map(({ id, title, projectId, dueDate }) => ({ id, title, projectId, dueDate })),
    open,
  };
}

/**
 * Close the week: freeze a snapshot, keep carried tasks on the board,
 * drop the rest to Backlog, and copy focus projects + WIP limit forward.
 */
export async function submitWeekReview(actor: Actor, raw: WeekReviewInput, week?: ISODate) {
  const input = weekReviewSchema.parse(raw);
  const summary = await getWeekReview(actor, week);
  const openIds = new Set(summary.open.map((t) => t.id));
  const carry = input.carryOverIds.filter((id) => openIds.has(id));
  const drop = input.dropIds.filter((id) => openIds.has(id) && !carry.includes(id));
  const snapshot: ReviewSnapshot = {
    done: summary.done,
    slipped: summary.slipped,
    carriedOver: summary.open.filter((t) => carry.includes(t.id)).map(({ id, title, projectId }) => ({ id, title, projectId })),
  };
  const nextWeek = addDaysISO(summary.weekStart, 7);
  const db = getDb();
  const own = and(eq(task.userId, actor.userId), isNull(task.deletedAt));

  const [[saved]] = await db.batch([
    db
      .insert(weekPlan)
      .values({
        userId: actor.userId,
        weekStart: summary.weekStart,
        reviewNotes: input.reviewNotes,
        reviewSnapshot: snapshot,
        reviewedAt: actor.now,
      })
      .onConflictDoUpdate({
        target: [weekPlan.userId, weekPlan.weekStart],
        set: { reviewNotes: input.reviewNotes, reviewSnapshot: snapshot, reviewedAt: actor.now },
      })
      .returning(),
    // Carried tasks simply stay where they are (This Week / Doing / Waiting).
    // Everything else the user chose to drop goes back to Backlog.
    db
      .update(task)
      .set({ status: "backlog" })
      .where(and(own, inArray(task.id, drop.length ? drop : [crypto.randomUUID()]))),
    db
      .insert(weekPlan)
      .values({
        userId: actor.userId,
        weekStart: nextWeek,
        activeProjectIds: summary.plan.activeProjectIds,
        wipLimit: summary.plan.wipLimit,
      })
      .onConflictDoNothing(),
  ]);
  await activityInsert(db, actor, [
    {
      entityType: "week_plan",
      entityId: saved.id,
      action: "reviewed",
      meta: { done: snapshot.done.length, slipped: snapshot.slipped.length, carried: carry.length, dropped: drop.length },
    },
  ]);
  return { plan: saved, snapshot };
}
