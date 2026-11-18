import { parseBody, route } from "@/server/api";
import { taskReorderSchema } from "@/lib/validation";
import { reorderTasks } from "@/server/services/tasks";

export const POST = route(async ({ req, actor }) => reorderTasks(actor, await parseBody(req, taskReorderSchema)));
