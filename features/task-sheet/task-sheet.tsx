"use client";

import { useUiStore } from "@/stores/ui";
import { Sheet } from "@/components/ui/sheet";
import { TaskSheetBody } from "./task-sheet-body";

/**
 * Global task editor. Opens from anywhere via useUiStore().openTask(id).
 * Keyed by id so drafts and the editor reset when another task opens.
 */
export function TaskSheet() {
  const id = useUiStore((s) => s.editingTaskId);
  const closeTask = useUiStore((s) => s.closeTask);

  return (
    <Sheet open={id !== null} onOpenChange={(open) => !open && closeTask()} title="Task">
      {id && <TaskSheetBody key={id} id={id} onClose={closeTask} />}
    </Sheet>
  );
}
