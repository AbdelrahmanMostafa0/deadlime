import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import { activityLog, project, task } from "@/db/schema";
import type { EntityType, RuleId } from "@/lib/domain";
import type { Actor } from "../api";

export type ActivityEntry = {
  entityType: EntityType;
  entityId: string;
  action: string;
  rule?: RuleId | null;
  meta?: Record<string, unknown>;
};

/** Insert query for activity rows, to be included in a db.batch with the change itself. */
export function activityInsert(db: DB, actor: Actor, entries: ActivityEntry[]) {
  return db.insert(activityLog).values(
    entries.map((e) => ({
      userId: actor.userId,
      entityType: e.entityType,
      entityId: e.entityId,
      action: e.action,
      rule: e.rule ?? null,
      source: actor.source,
      meta: e.meta ?? {},
    })),
  );
}

export async function listActivity(actor: Actor, entityType: EntityType, entityId: string, limit = 50) {
  return getDb()
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.userId, actor.userId),
        eq(activityLog.entityType, entityType),
        eq(activityLog.entityId, entityId),
      ),
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/** User-scoped activity from `since` (a calendar date, UTC midnight) onward, newest first. */
export async function listRecentActivity(actor: Actor, { since, limit = 50 }: { since: string; limit?: number }) {
  return getDb()
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.userId, actor.userId), gte(activityLog.createdAt, new Date(`${since}T00:00:00Z`))))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/** Current names of the tasks and projects an activity list refers to, keyed by entity id. Missing = deleted. */
export async function activityTitles(
  actor: Actor,
  rows: readonly { entityType: EntityType; entityId: string }[],
) {
  const idsOf = (type: EntityType) => [...new Set(rows.filter((r) => r.entityType === type).map((r) => r.entityId))];
  const taskIds = idsOf("task");
  const projectIds = idsOf("project");
  const db = getDb();
  const [tasks, projects] = await Promise.all([
    taskIds.length
      ? db
          .select({ id: task.id, title: task.title })
          .from(task)
          .where(and(eq(task.userId, actor.userId), inArray(task.id, taskIds)))
      : [],
    projectIds.length
      ? db
          .select({ id: project.id, title: project.name })
          .from(project)
          .where(and(eq(project.userId, actor.userId), inArray(project.id, projectIds)))
      : [],
  ]);
  return new Map([...tasks, ...projects].map((r) => [r.id, r.title]));
}
