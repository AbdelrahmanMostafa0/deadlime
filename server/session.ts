import "server-only";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type SessionUser = { id: string; name: string; email: string; image?: string | null };

/** Current user or null. Request-time read: call it inside a Suspense boundary. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
