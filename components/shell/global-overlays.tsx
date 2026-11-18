"use client";

import { CommandPalette } from "@/features/capture/command-palette";
import { useGlobalShortcuts } from "@/features/capture/use-global-shortcuts";
import { TaskSheet } from "@/features/task-sheet/task-sheet";

// Overlays available on every screen: the ⌘K palette and the task editor sheet.
// Each feature mounts its own overlay here.
export function GlobalOverlays() {
  useGlobalShortcuts();
  return (
    <>
      <CommandPalette />
      <TaskSheet />
    </>
  );
}
