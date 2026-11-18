import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { weekPlanUpdateSchema } from "@/lib/validation";
import { listProjects } from "@/server/services/projects";
import { getWeekPlan, setWeekPlan } from "@/server/services/week-plans";
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
}
