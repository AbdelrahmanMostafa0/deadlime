import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { addDaysISO } from "@/lib/dates";
import { activityTitles, listActivity, listRecentActivity } from "@/server/services/activity";
import { getTask } from "@/server/services/tasks";
import { mcpActor, timezoneSchema, toolResult } from "../context";

export function registerActivityTools(server: McpServer, userId: string) {
  server.registerTool(
    "get_activity",
    {
      description:
        "Recent activity log (created, moved, completed, automation rules...), newest first. With taskId: that task's history. Without: all activity since a date (default yesterday). Supply timezone for local today.",
      inputSchema: z.object({
        taskId: z.uuid().optional(),
        since: z.iso.date().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        timezone: timezoneSchema,
      }),
      annotations: { readOnlyHint: true },
    },
    (args) =>
      toolResult(async () => {
        const actor = mcpActor(userId, args.timezone);
        const limit = args.limit ?? 50;
        let rows;
        if (args.taskId) {
          await getTask(actor, args.taskId);
          rows = await listActivity(actor, "task", args.taskId, limit);
        } else {
          rows = await listRecentActivity(actor, { since: args.since ?? addDaysISO(actor.today, -1), limit });
        }
        const titles = await activityTitles(actor, rows);
        return rows.map((r) => ({
          at: r.createdAt.toISOString(),
          action: r.action,
          entityType: r.entityType,
          entityId: r.entityId,
          title: titles.get(r.entityId) ?? null,
          source: r.source,
          rule: r.rule,
          meta: r.meta,
        }));
      }),
  );
}
