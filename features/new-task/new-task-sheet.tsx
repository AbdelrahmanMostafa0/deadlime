"use client";

import { Sheet } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui";
import { NewTaskBody } from "./new-task-body";

/** Global "New task" sheet. Opens from anywhere via useUiStore().openNewTask(draft). */
export function NewTaskSheet() {
  const open = useUiStore((s) => s.newTaskOpen);
  const closeNewTask = useUiStore((s) => s.closeNewTask);
  return (
    <Sheet open={open} onOpenChange={(next) => !next && closeNewTask()} title="New task" selfScroll>
      {/* Mounted fresh on every open so the form re-seeds from the draft. */}
      {open && <NewTaskBody />}
    </Sheet>
  );
}
