"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const scopeLabels: Record<string, string> = {
  deadlime: "Read and change your projects and tasks",
  openid: "Identify your Deadlime account",
  profile: "Read your name and avatar",
  email: "Read your email address",
  offline_access: "Stay connected until you revoke access",
};

export function ConsentForm({
  clientName,
  scopes,
  oauthQuery,
}: {
  clientName: string;
  scopes: string[];
  oauthQuery: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function consent(accept: boolean) {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.oauth2.consent({ accept, oauth_query: oauthQuery });
      if (result.error) throw new Error(result.error.message ?? "Authorization failed. Please reconnect.");
      if (result.data?.url) window.location.assign(result.data.url);
      else throw new Error("No return URL. Please reconnect from your client.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authorization failed. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display-tight text-3xl font-extrabold">Connect to Deadlime</h1>
      <p>
        <strong className="break-words">{clientName}</strong> wants permission to:
      </p>
      <ul className="list-disc space-y-2 ps-5 text-ink-2">
        {scopes.map((scope) => (
          <li key={scope}>{scopeLabels[scope] ?? scope}</li>
        ))}
      </ul>
      <p className="text-sm text-ink-3">
        Only allow a connector you trust. Its name is supplied by the connector.
      </p>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          variant="lime"
          disabled={pending}
          onClick={() => consent(true)}
          aria-label={`Allow ${clientName} access`}
        >
          Allow
        </Button>
        <Button
          variant="default"
          disabled={pending}
          onClick={() => consent(false)}
          aria-label={`Deny ${clientName} access`}
        >
          Deny
        </Button>
      </div>
      {pending && <p role="status">Returning to your client…</p>}
    </div>
  );
}
