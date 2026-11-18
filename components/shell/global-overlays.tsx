"use client";

import { CommandPalette } from "@/features/capture/command-palette";
import { useGlobalShortcuts } from "@/features/capture/use-global-shortcuts";

// Overlays available on every screen: the ⌘K palette and the task editor sheet.
// Each feature mounts its own overlay here.
export function GlobalOverlays() {
  useGlobalShortcuts();
  return (
    <>
      <CommandPalette />
    </>
  );
}
