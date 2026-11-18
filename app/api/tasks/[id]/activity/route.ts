import { route } from "@/server/api";
import { listActivity } from "@/server/services/activity";

export const GET = route<{ id: string }>(({ actor, params }) => listActivity(actor, "task", params.id));
