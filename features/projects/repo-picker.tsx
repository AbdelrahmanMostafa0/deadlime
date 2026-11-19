"use client";

import { Command } from "cmdk";
import { Lock } from "lucide-react";
import { useState } from "react";
import { control } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type RepoOption = { id: number; fullName: string; private: boolean };

type Props = {
  options: RepoOption[];
  disabled?: boolean;
  onPick: (repoId: number) => void;
};

/** Type-to-search repo picker. Picking a repo links it right away. */
export function RepoPicker({ options, disabled, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const empty = options.length === 0;

  const pick = (id: number) => {
    onPick(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <Command
      label="Link a repository"
      loop
      className="relative mt-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <Command.Input
        value={query}
        onValueChange={(v) => {
          setQuery(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        disabled={disabled || empty}
        aria-label="Search repositories to link"
        placeholder={empty ? "All your repos are linked" : "Search your repos…"}
        className={cn(control, "min-h-11")}
      />
      {open && !empty && (
        <Command.List
          // Keep focus in the input so a click selects instead of closing the list first.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto rounded-btn border-2 border-ink bg-card p-1.5 shadow-pop-sm"
        >
          <Command.Empty className="px-2.5 py-3 text-sm text-ink-3">No repo matches.</Command.Empty>
          {options.map((r) => (
            <Command.Item
              key={r.id}
              value={r.fullName}
              onSelect={() => pick(r.id)}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-btn border-2 border-transparent px-2.5 font-mono text-sm data-[selected=true]:border-ink data-[selected=true]:bg-lime-soft"
            >
              <span className="min-w-0 flex-1 truncate">{r.fullName}</span>
              {r.private && <Lock aria-label="Private" className="size-3.5 shrink-0 text-ink-3" />}
            </Command.Item>
          ))}
        </Command.List>
      )}
    </Command>
  );
}
