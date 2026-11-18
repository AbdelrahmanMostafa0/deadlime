import "server-only";
import { mcp } from "@better-auth/mcp";
import { jwt } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { serverEnv } from "@/lib/env";

function createAuth() {
  const env = serverEnv();
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    // Open sign-in: any Google or GitHub account gets its own workspace.
    // Data isolation is enforced per user in the service layer.
    socialProviders: {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
      github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
    },
    account: { accountLinking: { enabled: true, trustedProviders: ["google", "github"] } },
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    plugins: [
      jwt(),
      mcp({
        loginPage: "/sign-in",
        consentPage: "/oauth/consent",
        resource: `${env.BETTER_AUTH_URL}/api/mcp`,
        scopes: ["openid", "profile", "email", "offline_access", "deadlime"],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        grantTypes: ["authorization_code", "refresh_token"],
      }),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

/** Lazy so the build never needs auth secrets. */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
