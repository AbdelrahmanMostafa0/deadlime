import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { textToDoc } from "@/lib/rich-text";
import { TASK_STATUSES } from "@/lib/domain";
import { taskCreateSchema, taskListQuerySchema, taskUpdateSchema } from "@/lib/validation";
import { AppError } from "@/server/errors";
import { listTaskLinks } from "@/server/services/github/links";
import { listProjects } from "@/server/services/projects";
import { getWipLimit } from "@/server/services/week-plans";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  reorderTasks,
  restoreTask,
  searchTasks,
  updateTask,
} from "@/server/services/tasks";
import { mcpActor, timezoneSchema, toolResult } from "../context";
import { formatTask, formatTaskLink } from "../format";
import { resolveProject } from "../resolve";

const project = z.string().trim().min(1).max(200);
const limit = z.number().int().min(1).max(100).optional();
const description = z.string().max(20_000);
const subtaskTitle = z.string().trim().min(1).max(200);
const newTask = taskUpdateSchema
  .pick({ title: true, status: true, priority: true, labels: true, dueDate: true, size: true })
  .extend({
    title: taskCreateSchema.shape.title,
    project: project.optional(),
    description: description.optional(),
    subtasks: z.array(subtaskTitle).max(50).optional(),
  });
const MAX_BULK = 50;
const FORCE_NOTE = "force overrides the Doing WIP limit only with user agreement.";

/** Column ids with `id` removed, then re-inserted at `position` (clamped to the column length). */
export function buildOrderedIds(columnIds: readonly string[], id: string, position: number) {
  const orderedIds = columnIds.filter((existing) => existing !== id);
  orderedIds.splice(Math.min(Math.max(position, 0), orderedIds.length), 0, id);
  return orderedIds;
}

/** Resolve exactly one of position, before or after into the new column order. */
export function resolveOrderedIds(
  columnIds: readonly string[],
  id: string,
  status: string,
  target: { position?: number; before?: string; after?: string },
) {
  const given = [target.position, target.before, target.after].filter((v) => v !== undefined).length;
  if (given !== 1) throw new AppError("invalid", "Give exactly one of position, before or after.");
  if (target.position !== undefined) return buildOrderedIds(columnIds, id, target.position);
  const side = target.before !== undefined ? "before" : "after";
  const neighbour = target.before ?? target.after;
  const others = columnIds.filter((existing) => existing !== id);
  const index = neighbour === undefined || neighbour === id ? -1 : others.indexOf(neighbour);
  if (index === -1) throw new AppError("invalid", `${side} task is not in the ${status} column.`);
  return buildOrderedIds(columnIds, id, side === "before" ? index : index + 1);
}

/** Map an MCP task payload to the service input, resolving the project reference exactly. */
function toCreateInput(args: z.infer<typeof newTask>, projects: Parameters<typeof resolveProject>[0]) {
  const { project: reference, description: plain, subtasks, ...input } = args;
  return {
    ...input,
    projectId: reference ? resolveProject(projects, reference) : null,
    description: plain === undefined ? undefined : textToDoc(plain),
    subtasks: subtasks?.map((title) => ({ id: crypto.randomUUID(), title, done: false })),
  };
}

/** Split today's tasks into overdue, due today and doing. */
export function bucketToday(
  today: string,
  tasks: Parameters<typeof formatTask>[0][],
  projects: Parameters<typeof formatTask>[1],
  limit: number,
) {
  const format = (t: (typeof tasks)[number]) => formatTask(t, projects);
  const open = tasks.filter((t) => t.status !== "doing");
  const doing = tasks.filter((t) => t.status === "doing");
  return {
    today,
    overdue: open.filter((t) => t.dueDate !== null && t.dueDate < today).map(format),
    dueToday: open.filter((t) => t.dueDate === today).map(format),
    doing: doing.map(format),
    wip: { doing: doing.length, limit },
  };
}

export function registerTaskTools(server: McpServer, userId: string) {
  server.registerTool(
    "list_tasks",
    {
      description:
        "List tasks by project, status, calendar view or due date. Defaults to open tasks; up to 100 results. Supply timezone for local today/week.",
      inputSchema: taskListQuerySchema
        .pick({ projectId: true, status: true, view: true, dueBefore: true })
        .extend({
          projectId: z.uuid().optional(),
          project: project.optional(),
          timezone: timezoneSchema,
          limit,
        }),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const { project: reference, timezone, limit: cap = 50, ...query } = args;
        const actor = mcpActor(userId, timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        if (reference) {
          const resolved = resolveProject(projects, reference);
          if (query.projectId && query.projectId !== resolved)
            throw new AppError("invalid", "project and projectId refer to different projects.");
          query.projectId = resolved;
        }
        const tasks = await listTasks(actor, query);
        return {
          tasks: tasks.slice(0, cap).map((t) => formatTask(t, projects)),
          truncated: tasks.length > cap || tasks.length === 1000,
        };
      }),
  );

  server.registerTool(
    "get_task",
    {
      description:
        "Get one task by exact id, with its notes, subtasks and linked GitHub issues, pull requests and branches.",
      inputSchema: z.object({ id: z.uuid() }),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId);
        const [found, projects, links] = await Promise.all([
          getTask(actor, args.id),
          listProjects(actor, { includeArchived: true }),
          listTaskLinks(actor, args.id),
        ]);
        return { ...formatTask(found, projects), links: links.map(formatTaskLink) };
      }),
  );

  server.registerTool(
    "search_tasks",
    {
      description:
        "Fuzzy search task titles; returns scores (higher is better). When top matches are close or ambiguous, confirm the intended task with the user before changing anything. Use returned ids for changes.",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(200),
        includeDone: z.boolean().optional(),
        limit,
      }),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId);
        const [hits, projects] = await Promise.all([
          searchTasks(actor, args.query, args),
          listProjects(actor, { includeArchived: true }),
        ]);
        return hits.map((t) => formatTask(t, projects));
      }),
  );

  server.registerTool(
    "create_task",
    {
      description:
        "Create a task, optionally in a project (exact slug, name or id). Description is plain text. Returns the task and automation rules fired.",
      inputSchema: newTask.extend({ timezone: timezoneSchema }),
    },
    (args) =>
      toolResult(async () => {
        const { timezone, ...input } = args;
        const actor = mcpActor(userId, timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        const result = await createTask(actor, toCreateInput(input, projects));
        return {
          task: formatTask(result.task, projects),
          fired: result.fired,
          suggestComplete: result.suggestComplete,
        };
      }),
  );

  server.registerTool(
    "update_task",
    {
      description:
        "Change a task by exact id. project: null moves to Inbox; dueDate: null clears the date. snoozedUntil hides the task from Today until that date; null clears it. Subtasks replace the whole list. force overrides the Doing WIP limit only with user agreement.",
      inputSchema: taskUpdateSchema
        .pick({
          title: true,
          status: true,
          priority: true,
          labels: true,
          dueDate: true,
          size: true,
          snoozedUntil: true,
          force: true,
        })
        .extend({
          id: z.uuid(),
          project: project.nullable().optional(),
          description: description.optional(),
          subtasks: z
            .array(z.object({ title: subtaskTitle, done: z.boolean() }))
            .max(50)
            .optional(),
          timezone: timezoneSchema,
        }),
    },
    (args) =>
      toolResult(async () => {
        const { id, project: reference, description: plain, subtasks, timezone, ...input } = args;
        const actor = mcpActor(userId, timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        // Retain checklist identity by position/title where possible on replacement.
        const before = subtasks === undefined ? undefined : await getTask(actor, id);
        const result = await updateTask(actor, id, {
          ...input,
          ...(reference === undefined
            ? {}
            : {
                projectId: reference === null ? null : resolveProject(projects, reference),
              }),
          ...(plain === undefined ? {} : { description: textToDoc(plain) }),
          ...(subtasks === undefined
            ? {}
            : {
                subtasks: subtasks.map((s, i) => ({
                  ...s,
                  id: before?.subtasks[i]?.title === s.title ? before.subtasks[i].id : crypto.randomUUID(),
                })),
              }),
        });
        return {
          task: formatTask(result.task, projects),
          fired: result.fired,
          suggestComplete: result.suggestComplete,
        };
      }),
  );

  server.registerTool(
    "move_task",
    {
      description: `Move a task by exact id to a status column. Give exactly one of: position (0 = top; clamped to the column length), before (id of the task to sit directly above), or after (id of the task to sit directly below); the neighbour must be in the target column. status defaults to the task's current status. ${FORCE_NOTE}`,
      inputSchema: z.object({
        id: z.uuid(),
        status: z.enum(TASK_STATUSES).optional(),
        position: z.number().int().min(0).optional(),
        before: z.uuid().optional(),
        after: z.uuid().optional(),
        force: z.boolean().optional(),
        timezone: timezoneSchema,
      }),
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const current = await getTask(actor, args.id);
        const status = args.status ?? current.status;
        const [column, projects] = await Promise.all([
          listTasks(actor, { status }),
          listProjects(actor, { includeArchived: true }),
        ]);
        const result = await reorderTasks(actor, {
          taskId: args.id,
          status,
          orderedIds: resolveOrderedIds(
            column.map((t) => t.id),
            args.id,
            status,
            args,
          ),
          force: args.force,
        });
        return {
          task: formatTask(result.task, projects),
          fired: result.fired,
          suggestComplete: result.suggestComplete,
        };
      }),
  );

  server.registerTool(
    "get_today",
    {
      description:
        "What needs attention today: overdue and due-today tasks (not in Doing), tasks in Doing, and the Doing WIP count against its limit. Supply timezone for local today.",
      inputSchema: z.object({ timezone: timezoneSchema }),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const [tasks, projects, limit] = await Promise.all([
          listTasks(actor, { view: "today" }),
          listProjects(actor, { includeArchived: true }),
          getWipLimit(actor),
        ]);
        return bucketToday(actor.today, tasks, projects, limit);
      }),
  );

  server.registerTool(
    "complete_task",
    {
      description:
        "Complete a task by exact id (done defaults true), or reopen it with done: false. Runs and reports the normal completion automation rules.",
      inputSchema: z.object({ id: z.uuid(), done: z.boolean().optional(), timezone: timezoneSchema }),
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        const result = await updateTask(actor, args.id, { completed: args.done ?? true });
        return {
          task: formatTask(result.task, projects),
          fired: result.fired,
          suggestComplete: result.suggestComplete,
        };
      }),
  );

  server.registerTool(
    "create_tasks",
    {
      description: `Create up to ${MAX_BULK} tasks in one call, e.g. a project's backlog. Each item takes the same fields as create_task; project defaults to the top-level project. Not atomic: every project reference is checked first, then tasks are created in order and the result lists each one's outcome.`,
      inputSchema: z.object({
        project: project.optional(),
        tasks: z.array(newTask).min(1).max(MAX_BULK),
        timezone: timezoneSchema,
      }),
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        // Resolve every reference before writing so a typo creates nothing.
        const inputs = args.tasks.map((t) =>
          toCreateInput({ ...t, project: t.project ?? args.project }, projects),
        );
        const results = [];
        for (const [index, input] of inputs.entries()) {
          try {
            const result = await createTask(actor, input);
            results.push({ index, task: formatTask(result.task, projects), fired: result.fired });
          } catch (error) {
            if (error instanceof AppError)
              results.push({ index, title: input.title, error: error.code, message: error.message });
            else if (error instanceof z.ZodError)
              results.push({ index, title: input.title, error: "invalid", message: z.prettifyError(error) });
            else throw error;
          }
        }
        return { created: results.filter((r) => "task" in r).length, results };
      }),
  );

  server.registerTool(
    "delete_task",
    {
      description:
        "Delete a task by exact id. Deletes are soft: restore_task with the same id undoes it. Confirm with the user first when the task was found by fuzzy search.",
      inputSchema: z.object({ id: z.uuid() }),
      annotations: { destructiveHint: true },
    },
    (args) =>
      toolResult(async () => {
        await deleteTask(mcpActor(userId), args.id);
        return { deleted: args.id, undo: "restore_task" };
      }),
  );

  server.registerTool(
    "restore_task",
    {
      description:
        "Undo delete_task: bring a deleted task back by exact id, with its status and project unchanged.",
      inputSchema: z.object({ id: z.uuid() }),
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId);
        const [restored, projects] = await Promise.all([
          restoreTask(actor, args.id),
          listProjects(actor, { includeArchived: true }),
        ]);
        return formatTask(restored, projects);
      }),
  );
}
