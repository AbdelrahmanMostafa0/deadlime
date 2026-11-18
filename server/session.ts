import "server-only";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type SessionUser = { id: string; name: string; email: string; image?: string | null };

/** Current user or null. Request-time read: call it inside a Suspense boundary. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Read headers first: it marks the render as request-time before any env/DB access.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
