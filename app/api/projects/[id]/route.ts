import { parseBody, route } from "@/server/api";
import { projectUpdateSchema } from "@/lib/validation";
import { getProject, updateProject } from "@/server/services/projects";

type P = { id: string };

export const GET = route<P>(({ actor, params }) => getProject(actor, params.id));

export const PATCH = route<P>(async ({ req, actor, params }) =>
  updateProject(actor, params.id, await parseBody(req, projectUpdateSchema)),
);
