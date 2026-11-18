import { parseBody, route } from "@/server/api";
import { taskUpdateSchema } from "@/lib/validation";
import { deleteTask, getTask, updateTask } from "@/server/services/tasks";

type P = { id: string };

export const GET = route<P>(({ actor, params }) => getTask(actor, params.id));

export const PATCH = route<P>(async ({ req, actor, params }) =>
  updateTask(actor, params.id, await parseBody(req, taskUpdateSchema)),
);

export const DELETE = route<P>(({ actor, params }) => deleteTask(actor, params.id));
