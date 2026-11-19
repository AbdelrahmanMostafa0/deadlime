import { parseBody, route } from "@/server/api";
import { projectRepoLinkSchema } from "@/lib/validation";
import { linkRepo, listProjectRepos } from "@/server/services/github/links";

type P = { id: string };

export const GET = route<P>(({ actor, params }) => listProjectRepos(actor, params.id));

export const POST = route<P>(async ({ req, actor, params }) =>
  linkRepo(actor, params.id, await parseBody(req, projectRepoLinkSchema)),
);
