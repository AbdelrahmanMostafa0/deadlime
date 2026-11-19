"use client";

import { Lock, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip } from "@/components/ui/tags";
import { useGithubRepos, useLinkRepo, useProjectRepos, useUnlinkRepo } from "@/features/github/api";
import { repoUrl } from "@/features/github/github-meta";
import { copy } from "@/lib/copy";
import { RepoPicker } from "./repo-picker";

/** Repositories linked to a project, plus a picker for the user's other repos. */
export function ProjectRepos({ projectId }: { projectId: string }) {
  const repos = useProjectRepos(projectId);
  const github = useGithubRepos();
  const link = useLinkRepo(projectId);
  const unlink = useUnlinkRepo(projectId);

  const options = (github.data?.installations ?? [])
    .flatMap((i) => i.repos)
    .filter((r) => !r.archived && !r.projectIds.includes(projectId));
  const hasInstallation = (github.data?.installations.length ?? 0) > 0;

  return (
    <section aria-labelledby="repos-h" className="mb-6">
      <h2 id="repos-h" className="font-display-tight mb-3 text-2xl font-extrabold">Repositories</h2>
      {repos.isPending ? (
        <div role="status" aria-label="Loading">
          <Skeleton className="h-14" />
        </div>
      ) : repos.isError ? (
        <ErrorState message={copy.error} onRetry={() => void repos.refetch()} />
      ) : repos.data.length === 0 ? (
        <EmptyState
          title="No repos linked."
          body={
            hasInstallation || github.isPending
              ? "Link a repo so its issues and branches can find their tasks."
              : "Connect GitHub first, then link repos here."
          }
          action={
            !hasInstallation && !github.isPending && (
              <Link href="/settings" className="min-h-11 content-center text-sm font-bold underline">
                Open settings
              </Link>
            )
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {repos.data.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2 rounded-card border-2 border-ink bg-card ps-4 pe-1.5"
            >
              <a
                href={repoUrl(r.fullName)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate py-3 font-mono text-sm font-bold underline-offset-2 hover:underline"
              >
                {r.fullName}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              {r.private && (
                <Chip className="bg-sun" icon={<Lock aria-hidden className="size-2.5" />}>
                  Private
                </Chip>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Unlink ${r.fullName}`}
                disabled={unlink.isPending && unlink.variables === r.id}
                onClick={() => unlink.mutate(r.id)}
              >
                <X aria-hidden className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {hasInstallation && (
        <RepoPicker options={options} disabled={link.isPending} onPick={(id) => link.mutate(id)} />
      )}
    </section>
  );
}
