import { z } from "zod";
import { route } from "@/server/api";
import { unlinkTask } from "@/server/services/github/links";

type P = { id: string; linkId: string };

export const DELETE = route<P>(({ actor, params }) =>
  unlinkTask(actor, params.id, z.uuid().parse(params.linkId)),
);
