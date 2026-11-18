import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { listProjects } from "@/server/services/projects";
import { mcpActor, toolResult } from "../context";
import { formatProject } from "../format";

export function registerProjectTools(server: McpServer, userId: string) {
  server.registerTool(
    "list_projects",
    {
      description: "List your projects and their ids and slugs. Archived projects are excluded by default.",
      inputSchema: z.object({ includeArchived: z.boolean().optional() }),
      annotations: { readOnlyHint: true },
    },
    (args) => toolResult(async () => (await listProjects(mcpActor(userId), args)).map(formatProject)),
  );
}
