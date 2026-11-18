import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";
import { ConsentForm } from "@/features/oauth/consent-form";
import { getAuth } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Authorize connector" };

type Search = Promise<Record<string, string | string[] | undefined>>;

async function Consent({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined) params.append(key, value);
  }
  const query = params.toString();
  if (!(await getSessionUser())) redirect(`/sign-in?next=${encodeURIComponent(`/oauth/consent?${query}`)}`);
  if (!(await verifyOAuthQueryParams(query, serverEnv().BETTER_AUTH_SECRET))) {
    return <p role="alert">This authorization request is invalid or expired. Reconnect from your client.</p>;
  }
  const clientId = params.get("client_id");
  if (!clientId) return <p role="alert">Missing client. Reconnect from your client.</p>;
  const client = await getAuth().api.getOAuthClientPublic({
    query: { client_id: clientId },
    headers: await headers(),
  });
  return (
    <ConsentForm
      clientName={client.client_name ?? "Unnamed connector"}
      scopes={(params.get("scope") ?? "").split(" ").filter(Boolean)}
      oauthQuery={query}
    />
  );
}

export default function ConsentPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-dots px-4 py-10">
      <div className="w-full max-w-sm rounded-sheet border-[2.5px] border-ink bg-paper p-8 shadow-pop-xl">
        <Suspense fallback={<p role="status">Loading authorization…</p>}>
          <Consent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
