import { ExternalLink, GitBranch, Globe, Link as LinkIcon, PenTool, Share2, type LucideIcon } from "lucide-react";
import type { ProjectLink } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { LINK_KIND_TEXT } from "./project-meta";

const KIND_ICON: Record<ProjectLink["kind"], LucideIcon> = {
  repo: GitBranch,
  live: Globe,
  figma: PenTool,
  social: Share2,
  other: LinkIcon,
};

/** Icon buttons that open each link in a new tab. */
export function ProjectLinks({ links, className }: { links: ProjectLink[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map((link, i) => {
        const Icon = KIND_ICON[link.kind] ?? ExternalLink;
        const label = link.label || LINK_KIND_TEXT[link.kind];
        return (
          <li key={`${link.url}-${i}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              title={label}
              className="grid size-11 place-items-center rounded-btn border-2 border-ink bg-card shadow-pop-xs transition-spring hover:-translate-y-0.5 hover:bg-lime"
            >
              <Icon aria-hidden className="size-[18px]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
