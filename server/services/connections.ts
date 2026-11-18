import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from "@/db/schema";
import type { Actor } from "../api";
import { notFound } from "../errors";

/** An OAuth client (Claude, Claude Code, ...) the user allowed into their workspace. */
export type ConnectionView = {
  clientId: string;
  name: string;
  connectedAt: Date;
  /** Last token issued to it, i.e. roughly the last time it reconnected or refreshed. */
  lastUsedAt: string | null;
};

export async function listConnections(actor: Actor): Promise<ConnectionView[]> {
  const rows = await getDb()
    .select({
      clientId: oauthConsent.clientId,
      name: oauthClient.name,
      connectedAt: oauthConsent.createdAt,
      lastUsedAt: sql<string | null>`(
        select max(${oauthAccessToken.createdAt}) from ${oauthAccessToken}
        where ${oauthAccessToken.clientId} = ${oauthConsent.clientId}
          and ${oauthAccessToken.userId} = ${actor.userId}
      )`,
    })
    .from(oauthConsent)
    .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(eq(oauthConsent.userId, actor.userId))
    .orderBy(desc(oauthConsent.createdAt));

  // A client can hold several consent rows (re-consent); show it once, newest first.
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    if (seen.has(r.clientId)) return [];
    seen.add(r.clientId);
    return [{ ...r, name: r.name?.trim() || "Unnamed app" }];
  });
}

/**
 * Drops the user's consent and tokens for one client. Refresh stops at once;
 * an access token already issued is a self-contained JWT and works until it
 * expires (1 hour), because the MCP route verifies it without a DB lookup.
 */
export async function revokeConnection(actor: Actor, clientId: string): Promise<void> {
  const db = getDb();
  const mine = <T extends typeof oauthConsent | typeof oauthAccessToken | typeof oauthRefreshToken>(t: T) =>
    and(eq(t.userId, actor.userId), eq(t.clientId, clientId));
  const [consents] = await db.batch([
    db.delete(oauthConsent).where(mine(oauthConsent)).returning({ id: oauthConsent.id }),
    db.delete(oauthAccessToken).where(mine(oauthAccessToken)),
    db.delete(oauthRefreshToken).where(mine(oauthRefreshToken)),
  ]);
  if (consents.length === 0) throw notFound("Connection");
}
