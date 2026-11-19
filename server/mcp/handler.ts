import "server-only";
import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "mcp-handler";
import { getAuth } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { registerGithubTools } from "./tools/github";
import { registerProjectTools } from "./tools/projects";
import { registerTaskTools } from "./tools/tasks";
import { registerWeekTools } from "./tools/week";

export async function handleMcp(request: Request) {
  const resource = `${serverEnv().BETTER_AUTH_URL}/api/mcp`;
  return requireMcpAuth(
    getAuth(),
    async (req, claims) => {
      if (typeof claims.sub !== "string" || !claims.sub)
        return new Response("User token required", { status: 403 });
      // Per-request closure: no global actor or cross-user transport state.
      const userId = claims.sub;
      return createMcpHandler(
        (server) => {
          registerProjectTools(server, userId);
          registerTaskTools(server, userId);
          registerWeekTools(server, userId);
          registerGithubTools(server, userId);
        },
        { serverInfo: { name: "Deadlime", version: "1.0.0" }, maxSubscriptions: 0 },
      )(req);
    },
    { resource, requiredScopes: ["deadlime"] },
  )(request);
}
