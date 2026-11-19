import { parseQuery, route } from "@/server/api";
import { githubSearchQuerySchema } from "@/lib/validation";
import { searchGithub } from "@/server/services/github/links";

export const GET = route(({ req, actor }) => searchGithub(actor, parseQuery(req, githubSearchQuerySchema)));
