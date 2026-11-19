import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { githubDelivery } from "@/db/schema";
import { githubAppConfig } from "@/lib/env";
import { getGithubApp } from "@/server/services/github/client";
import { handleGithubEvent } from "@/server/services/github/webhooks";

const text = (body: string, status: number) => new Response(body, { status });

/** GitHub webhook receiver. Authenticated by HMAC signature, not by session. */
export async function POST(req: Request) {
  await connection();
  if (!githubAppConfig()) return text("not configured", 503);

  // Raw body first: the signature covers the exact bytes.
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature || !(await getGithubApp().webhooks.verify(body, signature)))
    return text("bad signature", 401);

  const deliveryId = req.headers.get("x-github-delivery");
  const event = req.headers.get("x-github-event");
  if (!deliveryId || !event) return text("missing headers", 400);

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return text("bad json", 400);
  }

  const db = getDb();
  const inserted = await db
    .insert(githubDelivery)
    .values({ id: deliveryId, event })
    .onConflictDoNothing()
    .returning({ id: githubDelivery.id });
  if (!inserted.length) return text("duplicate", 200);

  try {
    await handleGithubEvent(event, payload);
  } catch (error) {
    console.error("GitHub webhook failed:", event, error instanceof Error ? error.message : "unknown error");
    // Forget the delivery so GitHub's redelivery is processed instead of skipped as a duplicate.
    await db.delete(githubDelivery).where(eq(githubDelivery.id, deliveryId));
    return text("error", 500);
  }
  return text("ok", 200);
}
