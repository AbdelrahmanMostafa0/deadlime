"use client";

import { ExternalLink, GitMerge } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { useGithubRepos } from "./api";
import { installationSettingsUrl } from "./github-meta";
import { useInstallToast } from "./use-install-toast";

const INSTALL_HREF = "/api/github/install";

/** GitHub App connection: not configured, nothing installed, or each installation with a manage link. */
export function GithubSettings() {
  useInstallToast();
  const { data, isPending, isError, error, refetch } = useGithubRepos();

  if (isPending) {
    return (
      <div role="status" aria-label="Loading">
        <Skeleton className="h-20 rounded-card-lg" />
      </div>
    );
  }
  if (isError) {
    if (toApiError(error).code === "not_configured") {
      return (
        <p role="note" className="rounded-btn border-2 border-ink bg-sun/40 p-3 text-sm">
          GitHub isn&apos;t set up on this server. The GitHub App env vars are not set.
        </p>
      );
    }
    return <ErrorState message={copy.error} onRetry={() => void refetch()} />;
  }

  if (data.installations.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <p className="text-sm text-ink-2">
          Install the Deadlime GitHub App to link repos to projects and issues, PRs and branches to tasks.
        </p>
        <a href={INSTALL_HREF} className={cn(buttonVariants({ variant: "lime" }))}>
          <GitMerge aria-hidden className="size-4" /> Install GitHub App
        </a>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {data.installations.map((i) => (
          <li key={i.id}>
            <Card className="flex items-center gap-4 p-4">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-btn border-2 border-ink bg-lime"
              >
                <GitMerge className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{i.accountLogin}</p>
                <p className="text-xs text-ink-3">
                  {i.repos.length} {i.repos.length === 1 ? "repo" : "repos"}
                  {i.suspended && " · suspended"}
                </p>
              </div>
              <a
                href={installationSettingsUrl(i)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Manage on GitHub <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Card>
          </li>
        ))}
      </ul>
      <a href={INSTALL_HREF} className={cn(buttonVariants({ variant: "ghost" }), "self-start")}>
        Add another account
      </a>
    </div>
  );
}
