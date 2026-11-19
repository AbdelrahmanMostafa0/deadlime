"use client";

import { Command } from "cmdk";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { control } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useProjects } from "./api";
import { ProjectIcon } from "./project-icon";

type Props = {
  id?: string;
  value: string | null;
  onChange: (projectId: string | null) => void;
};

const ITEM =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-btn border-2 border-transparent px-2.5 text-sm font-semibold data-[selected=true]:border-ink data-[selected=true]:bg-lime-soft";

/** Type-to-search project picker (name or slug). "No project" files into the Inbox. */
export function ProjectCombobox({ id, value, onChange }: Props) {
  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = projects.data?.find((p) => p.id === value);

  const pick = (projectId: string | null) => {
    onChange(projectId);
    setQuery("");
    setOpen(false);
  };

  return (
    <Command
      label="Choose a project"
      loop
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          // Close the list only; a second Escape closes the sheet.
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      {selected && !open && (
        <span
          aria-hidden
          className="pointer-events-none absolute start-2.5 top-2.5 grid size-6 place-items-center rounded-md border-2 border-ink"
          style={{ backgroundColor: selected.color }}
        >
          <ProjectIcon name={selected.icon} className="size-3.5" />
        </span>
      )}
      <Command.Input
        id={id}
        value={open ? query : (selected?.name ?? "")}
        onValueChange={(v) => {
          setQuery(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        disabled={projects.isPending}
        autoComplete="off"
        placeholder={projects.isPending ? "Loading projects…" : "No project (Inbox)"}
        className={cn(control, "min-h-11", selected && !open && "ps-11")}
      />
      {open && (
        <Command.List
          // Keep focus in the input so a click selects instead of closing the list first.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-60 overflow-y-auto rounded-btn border-2 border-ink bg-card p-1.5 shadow-pop-sm"
        >
          <Command.Empty className="px-2.5 py-3 text-sm text-ink-3">No project matches.</Command.Empty>
          <Command.Item value="__inbox" keywords={["no project", "inbox", "none"]} onSelect={() => pick(null)} className={ITEM}>
            <Inbox aria-hidden className="size-4 shrink-0 text-ink-3" />
            <span className="min-w-0 flex-1 truncate">No project (Inbox)</span>
          </Command.Item>
          {projects.data?.map((p) => (
            <Command.Item key={p.id} value={p.id} keywords={[p.name, p.slug]} onSelect={() => pick(p.id)} className={ITEM}>
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink"
                style={{ backgroundColor: p.color }}
              >
                <ProjectIcon name={p.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <span className="font-mono text-xs text-ink-3">#{p.slug}</span>
            </Command.Item>
          ))}
        </Command.List>
      )}
    </Command>
  );
}
