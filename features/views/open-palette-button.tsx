"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui";

/** Empty-state action: opens the New task sheet. */
export function OpenPaletteButton({ label = "Add a task" }: { label?: string }) {
  const openNewTask = useUiStore((s) => s.openNewTask);
  return (
    <Button variant="lime" onClick={() => openNewTask()}>
      <Plus aria-hidden className="size-4" strokeWidth={3} />
      {label}
    </Button>
  );
}
