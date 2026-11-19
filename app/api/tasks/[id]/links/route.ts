import { parseBody, route } from "@/server/api";
import { taskLinkCreateSchema } from "@/lib/validation";
import { linkTask, listTaskLinks } from "@/server/services/github/links";

type P = { id: string };

export const GET = route<P>(({ actor, params }) => listTaskLinks(actor, params.id));

export const POST = route<P>(async ({ req, actor, params }) =>
  linkTask(actor, params.id, (await parseBody(req, taskLinkCreateSchema)).ref),
);
