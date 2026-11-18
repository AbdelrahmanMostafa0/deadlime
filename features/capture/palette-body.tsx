"use client";

import { Command } from "cmdk";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import { useProjects } from "@/features/projects/api";
import { STATUS_LABEL } from "@/lib/domain";
import { parseCapture } from "@/lib/parse-capture";
import { useUiStore } from "@/stores/ui";
import { ExistingTasksGroup } from "./existing-tasks-group";
import { JumpGroup } from "./jump-group";
import { PaletteFooter } from "./palette-footer";
import { PaletteItem } from "./palette-item";
import { ParsedChips } from "./parsed-chips";
import { useCaptureSubmit } from "./use-capture-submit";
import { useTaskSearch } from "./use-task-search";

/** Mounted fresh on every open, so the input always starts clean (or prefilled). */
export function PaletteBody() {
  const router = useRouter();
  const { closePalette, openTask } = useUiStore();
  const defaultStatus = useUiStore((s) => s.paletteStatus) ?? "this_week";
  const [text, setText] = useState(() => useUiStore.getState().palettePrefill);
  const projects = useProjects().data ?? [];

  const parsed = parseCapture(text, projects);
  const existing = useTaskSearch(parsed.title);
  const submit = useCaptureSubmit(closePalette);

  const go = (href: string) => {
    closePalette();
    router.push(href);
  };
  const open = (id: string) => {
    closePalette();
    openTask(id);
  };

  // Shift+Enter files into Backlog. Handled before cmdk sees the key.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(parsed, "backlog");
    }
  };

  const project = projects.find((p) => p.id === parsed.projectId);
  const where = project ? project.name : "Inbox";

  return (
    <Command label="Quick capture and navigation" shouldFilter={false} loop onKeyDown={onKeyDown}>
      <Command.Input
        value={text}
        onValueChange={setText}
        data-autofocus
        placeholder="Command or new task: fix login bug #pharmacy !high tomorrow"
        aria-label="Command or new task"
        className="w-full border-b-2 border-ink bg-card px-5 py-4 text-lg font-bold outline-none placeholder:font-medium placeholder:text-ink-4"
      />
      <ParsedChips parsed={parsed} projects={projects} />
      <Command.List className="max-h-[48dvh] overflow-y-auto border-t-2 border-line px-2.5 pb-2">
        <Command.Group heading="Create" className="px-2.5 pt-3 pb-1 [&_[cmdk-group-heading]]:label-mono">
          <PaletteItem
            value="create"
            onSelect={() => submit(parsed, defaultStatus)}
            disabled={!parsed.title}
            icon={<Plus className="size-4" strokeWidth={3} />}
            iconColor="var(--color-lime)"
            label={parsed.title ? `Create "${parsed.title}"` : "Type a title first"}
            meta={
              parsed.title
                ? `Lands in ${STATUS_LABEL[defaultStatus]} · ${where}${parsed.dueDate ? ` · due ${parsed.dueText}` : ""}`
                : "We can create many things. Vibes are not one of them."
            }
          />
        </Command.Group>
        <ExistingTasksGroup tasks={existing} projects={projects} onOpen={open} />
        <JumpGroup query={text} projects={projects} onGo={go} />
      </Command.List>
      <PaletteFooter />
    </Command>
  );
}
