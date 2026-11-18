import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { textToDoc } from "@/lib/rich-text";
import { taskCreateSchema, taskListQuerySchema, taskUpdateSchema } from "@/lib/validation";
import { AppError } from "@/server/errors";
import { listProjects } from "@/server/services/projects";
import { createTask, getTask, listTasks, searchTasks, updateTask } from "@/server/services/tasks";
import { mcpActor, timezoneSchema, toolResult } from "../context";
import { formatTask } from "../format";
import { resolveProject } from "../resolve";

const project = z.string().trim().min(1).max(200);
const limit = z.number().int().min(1).max(100).optional();
const description = z.string().max(20_000);
const subtaskTitle = z.string().trim().min(1).max(200);

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
      inputSchema: taskUpdateSchema
        .pick({ title: true, status: true, priority: true, labels: true, dueDate: true, size: true })
        .extend({
          title: taskCreateSchema.shape.title,
          project: project.optional(),
          description: description.optional(),
          subtasks: z.array(subtaskTitle).max(50).optional(),
          timezone: timezoneSchema,
        }),
    },
    (args) =>
      toolResult(async () => {
        const { project: reference, description: plain, subtasks, timezone, ...input } = args;
        const actor = mcpActor(userId, timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        const result = await createTask(actor, {
          ...input,
          projectId: reference ? resolveProject(projects, reference) : null,
          description: plain === undefined ? undefined : textToDoc(plain),
          subtasks: subtasks?.map((title) => ({ id: crypto.randomUUID(), title, done: false })),
        });
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
        "Change a task by exact id. project: null moves to Inbox; dueDate: null clears the date. Subtasks replace the whole list. force overrides the Doing WIP limit only with user agreement.",
      inputSchema: taskUpdateSchema
        .pick({
          title: true,
          status: true,
          priority: true,
          labels: true,
          dueDate: true,
          size: true,
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
}
