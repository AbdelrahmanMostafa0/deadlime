import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { projectCreateSchema, projectUpdateSchema } from "@/lib/validation";
import { createProject, listProjects, updateProject } from "@/server/services/projects";
import { mcpActor, toolResult } from "../context";
import { formatProject } from "../format";
import { resolveProject } from "../resolve";

const projectEditFields = { color: true, icon: true, status: true, links: true, notes: true } as const;

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

  server.registerTool(
    "create_project",
    {
      description:
        "Create a project. slug is the short handle used in quick capture (#handle); it is derived from the name when omitted and made unique. color is a hex like #FF8A3D. links are repo/deploy/design/docs URLs.",
      inputSchema: projectCreateSchema.pick({ name: true, slug: true, ...projectEditFields }),
    },
    (args) => toolResult(async () => formatProject(await createProject(mcpActor(userId), args))),
  );

  server.registerTool(
    "update_project",
    {
      description:
        "Edit a project by exact slug, name or id. archived: true archives it (hidden, tasks kept), false restores it. links and notes replace the stored value. Omitted fields stay unchanged.",
      inputSchema: projectUpdateSchema
        .pick({ name: true, slug: true, archived: true, ...projectEditFields })
        .extend({
          project: z.string().trim().min(1).max(200),
        }),
    },
    (args) =>
      toolResult(async () => {
        const { project: reference, ...input } = args;
        const actor = mcpActor(userId);
        const projects = await listProjects(actor, { includeArchived: true });
        return formatProject(await updateProject(actor, resolveProject(projects, reference), input));
      }),
  );
}
