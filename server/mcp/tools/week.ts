import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { weekPlanUpdateSchema, weekReviewSchema } from "@/lib/validation";
import { listProjects } from "@/server/services/projects";
import { getWeekPlan, getWeekReview, setWeekPlan, submitWeekReview } from "@/server/services/week-plans";
import { mcpActor, timezoneSchema, toolResult } from "../context";
import { formatWeekPlan } from "../format";
import { resolveProject } from "../resolve";

const calendar = { week: z.iso.date().optional(), timezone: timezoneSchema };

export function registerWeekTools(server: McpServer, userId: string) {
  server.registerTool(
    "get_week_plan",
    {
      description:
        "Get the Monday-based plan for a date, defaulting to the current week in timezone (UTC by default).",
      inputSchema: z.object(calendar),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const [plan, projects] = await Promise.all([
          getWeekPlan(actor, args.week),
          listProjects(actor, { includeArchived: true }),
        ]);
        return formatWeekPlan(plan, projects);
      }),
  );
  server.registerTool(
    "set_week_plan",
    {
      description:
        "Update a week's focus projects, Doing WIP limit (1–10), or review notes. Project references must be exact slugs, names or ids. Omitted fields stay unchanged.",
      inputSchema: weekPlanUpdateSchema.omit({ activeProjectIds: true }).extend({
        ...calendar,
        activeProjects: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
      }),
    },
    (args) =>
      toolResult(async () => {
        const { week, timezone, activeProjects, ...input } = args;
        const actor = mcpActor(userId, timezone);
        const projects = await listProjects(actor, { includeArchived: true });
        const plan = await setWeekPlan(
          actor,
          {
            ...input,
            ...(activeProjects === undefined
              ? {}
              : {
                  activeProjectIds: [...new Set(activeProjects.map((p) => resolveProject(projects, p)))],
                }),
          },
          week,
        );
        return formatWeekPlan(plan, projects);
      }),
  );

  server.registerTool(
    "get_week_review",
    {
      description:
        "Get the weekly review for a week: tasks done, tasks that slipped past their due date, and open tasks still on the board (the carry-over candidates for submit_week_review).",
      inputSchema: z.object(calendar),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const [review, projects] = await Promise.all([
          getWeekReview(actor, args.week),
          listProjects(actor, { includeArchived: true }),
        ]);
        const name = (id: string | null) => projects.find((p) => p.id === id)?.name ?? null;
        const named = <T extends { projectId: string | null }>(list: T[]) =>
          list.map((t) => ({ ...t, project: name(t.projectId) }));
        return {
          week: review.weekStart,
          weekEnd: review.weekEnd,
          reviewed: review.plan.reviewedAt !== null,
          plan: formatWeekPlan(review.plan, projects),
          done: named(review.done),
          slipped: named(review.slipped),
          open: named(review.open),
        };
      }),
  );

  server.registerTool(
    "submit_week_review",
    {
      description:
        "Close a week. Freezes the done/slipped snapshot, keeps carryOverIds on the board, moves dropIds back to Backlog, and copies focus projects and WIP limit to next week. Open tasks in neither list stay where they are. Only call after the user has decided what to carry and drop; ids come from get_week_review.",
      inputSchema: weekReviewSchema.extend(calendar),
    },
    (args) =>
      toolResult(async () => {
        const { week, timezone, ...input } = args;
        const { plan, snapshot } = await submitWeekReview(mcpActor(userId, timezone), input, week);
        return { week: plan.weekStart, reviewedAt: plan.reviewedAt, snapshot };
      }),
  );
}
