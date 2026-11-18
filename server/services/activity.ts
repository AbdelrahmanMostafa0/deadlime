import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import { activityLog } from "@/db/schema";
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
