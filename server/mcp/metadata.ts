import "server-only";
import { connection } from "next/server";
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler";
import { getAuth } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

export async function authorizationMetadata(request: Request) {
  await connection();
  return oauthProviderAuthServerMetadata(getAuth(), { headers: { "Access-Control-Allow-Origin": "*" } })(
    request,
  );
}

export async function resourceMetadata(request: Request) {
  await connection();
  const origin = serverEnv().BETTER_AUTH_URL;
  const response = protectedResourceHandler({
    authServerUrls: [`${origin}/api/auth`],
    resourceUrl: `${origin}/api/mcp`,
  })(request);
  // Advertise the same scope enforced by requireMcpAuth.
  return response
    .json()
    .then((metadata: Record<string, unknown>) =>
      Response.json({ ...metadata, scopes_supported: ["deadlime"] }, { headers: response.headers }),
    );
}

export const metadataOptions = metadataCorsOptionsRequestHandler();
