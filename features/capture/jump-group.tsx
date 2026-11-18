import { Command } from "cmdk";
import { Folder } from "lucide-react";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import type { ProjectDTO } from "@/lib/api-types";
import { PaletteItem } from "./palette-item";

const heading = "px-2.5 pt-3 pb-1 [&_[cmdk-group-heading]]:label-mono";

/** Navigation commands: every screen plus every project, filtered by what was typed. */
export function JumpGroup({
  query,
  projects,
  onGo,
}: {
  query: string;
  projects: ProjectDTO[];
  onGo: (href: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const matches = (label: string) => !q || label.toLowerCase().includes(q);
  const pages = NAV_ITEMS.filter((n) => matches(n.label));
  const projectHits = projects.filter((p) => !p.archivedAt && matches(p.name));
  if (pages.length + projectHits.length === 0) return null;

  return (
    <Command.Group heading="Jump to" className={heading}>
      {pages.map(({ href, label, icon: Icon, shortcut }) => (
        <PaletteItem
          key={href}
          value={`nav-${href}`}
          onSelect={() => onGo(href)}
          icon={<Icon className="size-4" />}
          label={label}
          meta={`g then ${shortcut}`}
        />
      ))}
      {projectHits.map((p) => (
        <PaletteItem
          key={p.id}
          value={`project-${p.id}`}
          onSelect={() => onGo(`/projects/${p.id}`)}
          icon={<Folder className="size-4" />}
          iconColor={p.color}
          label={p.name}
          meta={`#${p.slug}`}
        />
      ))}
    </Command.Group>
  );
}
