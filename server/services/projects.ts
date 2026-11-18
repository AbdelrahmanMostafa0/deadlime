import "server-only";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { project, task } from "@/db/schema";
import {
  projectCreateSchema,
  projectUpdateSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from "@/lib/validation";
import type { Actor } from "../api";
import { AppError, notFound } from "../errors";
import { activityInsert } from "./activity";

const MAX_PROJECTS = 100;

export type ProjectWithStats = typeof project.$inferSelect & {
  openCount: number;
  doneCount: number;
  /** Last time any task in the project changed (or the project itself). */
  lastActivityAt: string;
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "project"
  );
}

export async function listProjects(
  actor: Actor,
  opts: { includeArchived?: boolean } = {},
): Promise<ProjectWithStats[]> {
  const db = getDb();
  const rows = await db
    .select({
      project,
      openCount: sql<number>`count(${task.id}) filter (where ${task.status} <> 'done')`.mapWith(Number),
      doneCount: sql<number>`count(${task.id}) filter (where ${task.status} = 'done')`.mapWith(Number),
      lastActivityAt: sql<string>`greatest(${project.updatedAt}, max(${task.updatedAt}))`,
    })
    .from(project)
    .leftJoin(task, and(eq(task.projectId, project.id), isNull(task.deletedAt)))
    .where(
      and(eq(project.userId, actor.userId), opts.includeArchived ? undefined : isNull(project.archivedAt)),
    )
    .groupBy(project.id)
    .orderBy(asc(project.createdAt));
  return rows.map((r) => ({
    ...r.project,
    openCount: r.openCount,
    doneCount: r.doneCount,
    lastActivityAt: new Date(r.lastActivityAt).toISOString(),
  }));
}

export async function getProject(actor: Actor, id: string) {
  const [row] = await getDb()
    .select()
    .from(project)
    .where(and(eq(project.id, id), eq(project.userId, actor.userId)));
  if (!row) throw notFound("Project");
  return row;
}

/** Throws unless the project exists and belongs to the actor. */
export async function assertOwnProject(actor: Actor, id: string | null | undefined) {
  if (id) await getProject(actor, id);
}

async function uniqueSlug(actor: Actor, wanted: string, exceptId?: string) {
  const taken = new Set(
    (
      await getDb()
        .select({ slug: project.slug, id: project.id })
        .from(project)
        .where(eq(project.userId, actor.userId))
    )
      .filter((p) => p.id !== exceptId)
      .map((p) => p.slug),
  );
  if (!taken.has(wanted)) return wanted;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${wanted}-${i}`)) return `${wanted}-${i}`;
  throw new AppError("conflict", "Pick a different handle.");
}

export async function createProject(actor: Actor, raw: ProjectCreateInput) {
  const input = projectCreateSchema.parse(raw);
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(project)
    .where(eq(project.userId, actor.userId));
  if (count >= MAX_PROJECTS) throw new AppError("conflict", "That's a lot of projects. Archive some first.");

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(actor, input.slug ?? slugify(input.name));
  const [[created]] = await db.batch([
    db
      .insert(project)
      .values({ ...input, id, slug, userId: actor.userId })
      .returning(),
    activityInsert(db, actor, [{ entityType: "project", entityId: id, action: "created" }]),
  ]);
  return created;
}

export async function updateProject(actor: Actor, id: string, raw: ProjectUpdateInput) {
  const { archived, ...input } = projectUpdateSchema.parse(raw);
  const before = await getProject(actor, id);
  const db = getDb();
  const slug = input.slug && input.slug !== before.slug ? await uniqueSlug(actor, input.slug, id) : undefined;
  const values = {
    ...input,
    ...(slug ? { slug } : { slug: undefined }),
    ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
  };
  const action = archived === true ? "archived" : archived === false ? "unarchived" : "updated";
  const [[updated]] = await db.batch([
    db
      .update(project)
      .set(values)
      .where(and(eq(project.id, id), eq(project.userId, actor.userId)))
      .returning(),
    activityInsert(db, actor, [
      { entityType: "project", entityId: id, action, meta: { fields: Object.keys(raw) } },
    ]),
  ]);
  return updated;
}
