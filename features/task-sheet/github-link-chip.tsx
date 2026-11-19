import { GitBranch, GitPullRequest, CircleDot, X, type LucideIcon } from "lucide-react";
import { linkLabel } from "@/features/github/github-meta";
import type { TaskLinkDTO } from "@/lib/api-types";
import type { LinkState, LinkTargetKind } from "@/lib/domain";
import { cn } from "@/lib/cn";

const KIND_ICON: Record<LinkTargetKind, LucideIcon> = { issue: CircleDot, pr: GitPullRequest, branch: GitBranch };

const STATE_STYLE: Record<LinkState, string> = {
  open: "bg-lime",
  closed: "bg-pink",
  merged: "bg-sun",
  draft: "bg-card",
};

type GithubLinkChipProps = { link: TaskLinkDTO; onRemove: () => void };

/** One linked issue / PR / branch: opens on GitHub, with its state and a remove button. */
export function GithubLinkChip({ link, onRemove }: GithubLinkChipProps) {
  const Icon = KIND_ICON[link.kind];
  const label = linkLabel(link);
  return (
    <li className="flex items-center gap-1 rounded-card border-2 border-ink bg-card ps-3 pe-1">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-2 py-2 text-sm"
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-mono text-xs font-bold">{label}</span>
          {link.kind !== "branch" && <span className="block truncate">{link.title}</span>}
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <span
        className={cn(
          "inline-flex h-6 shrink-0 items-center rounded-tag border-2 border-ink px-2 font-mono text-[11px] font-bold",
          STATE_STYLE[link.state],
        )}
      >
        {link.state}
      </span>
      <button
        type="button"
        aria-label={`Remove link ${label}`}
        onClick={onRemove}
        className="relative grid size-8 shrink-0 place-items-center rounded-full transition-spring after:absolute after:-inset-1 hover:bg-pink"
      >
        <X aria-hidden className="size-3.5" strokeWidth={3} />
      </button>
    </li>
  );
}
