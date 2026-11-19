import { route } from "@/server/api";
import { listGithubRepos } from "@/server/services/github/links";

export const GET = route(({ actor }) => listGithubRepos(actor));
