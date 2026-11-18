import { projectCreateSchema } from "@/lib/validation";
import { route, parseBody } from "@/server/api";
import { createProject, listProjects } from "@/server/services/projects";

export const GET = route(({ req, actor }) =>
  listProjects(actor, { includeArchived: new URL(req.url).searchParams.get("archived") === "1" }),
);

export const POST = route(async ({ req, actor }) => createProject(actor, await parseBody(req, projectCreateSchema)));
