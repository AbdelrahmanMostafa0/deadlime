"use client";

import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import { useConnections, useRevokeConnection } from "./api";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** Apps the user allowed in over OAuth (Claude, Claude Code, ...), with revoke. */
export function ConnectionsList() {
  const { data, isPending, isError, refetch } = useConnections();
  const revoke = useRevokeConnection();

  if (isPending) {
    return (
      <div role="status" aria-label="Loading" className="flex flex-col gap-3">
        <Skeleton className="h-20 rounded-card-lg" />
      </div>
    );
  }
  if (isError) return <ErrorState message={copy.error} onRetry={refetch} />;
  if (data.length === 0) {
    return (
      <EmptyState
        title="Nothing connected. Yet."
        body="Follow the steps above and Claude shows up here. Then it can nag you too."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((c) => (
        <li key={c.clientId}>
          <Card className="flex items-center gap-4 p-4">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-btn border-2 border-ink bg-lime"
            >
              <Plug className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.name}</p>
              <p className="text-xs text-ink-3">
                Connected {date(c.connectedAt)}
                {c.lastUsedAt && ` · last token ${date(c.lastUsedAt)}`}
              </p>
            </div>
            <Button
              size="sm"
              variant="pink"
              disabled={revoke.isPending && revoke.variables === c.clientId}
              onClick={() => revoke.mutate(c.clientId)}
            >
              Disconnect
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
