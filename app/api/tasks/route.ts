import { parseBody, parseQuery, route } from "@/server/api";
import { taskCreateSchema, taskListQuerySchema } from "@/lib/validation";
import { createTask, listTasks } from "@/server/services/tasks";

export const GET = route(({ req, actor }) => listTasks(actor, parseQuery(req, taskListQuerySchema)));

export const POST = route(async ({ req, actor }) => createTask(actor, await parseBody(req, taskCreateSchema.partial().required({ title: true }))));
