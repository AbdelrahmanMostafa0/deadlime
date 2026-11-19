import { z } from "zod";
import { route } from "@/server/api";
import { unlinkRepo } from "@/server/services/github/links";

type P = { id: string; repoId: string };

export const DELETE = route<P>(({ actor, params }) =>
  unlinkRepo(actor, params.id, z.coerce.number().int().positive().parse(params.repoId)),
);
