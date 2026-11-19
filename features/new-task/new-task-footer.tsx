"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/tags";
import { useUiStore } from "@/stores/ui";

type NewTaskFooterProps = { pending: boolean; onSubmit: () => void };

/** Thumb zone pinned under the scrolling fields: Cancel and Create. */
export function NewTaskFooter({ pending, onSubmit }: NewTaskFooterProps) {
  const closeNewTask = useUiStore((s) => s.closeNewTask);
  return (
    <footer className="flex shrink-0 items-center gap-3 border-t-2 border-ink bg-paper-2 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <span aria-hidden className="hidden items-center gap-1 text-[11px] text-ink-3 md:flex">
        <Kbd>⌘</Kbd>/<Kbd>Ctrl</Kbd>+<Kbd>↵</Kbd> create
      </span>
      <Button variant="ghost" onClick={closeNewTask} className="ms-auto">
        Cancel
      </Button>
      <Button variant="lime" onClick={onSubmit} disabled={pending}>
        {pending ? "Creating…" : "Create task"}
      </Button>
    </footer>
  );
}
