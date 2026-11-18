import { route } from "@/server/api";
import { restoreTask } from "@/server/services/tasks";

export const POST = route<{ id: string }>(({ actor, params }) => restoreTask(actor, params.id));
