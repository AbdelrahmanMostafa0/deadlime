"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui";

/** Empty-state action: opens the capture palette. */
export function OpenPaletteButton({ label = "Add a task" }: { label?: string }) {
  const openPalette = useUiStore((s) => s.openPalette);
  return (
    <Button variant="lime" onClick={() => openPalette()}>
      <Plus aria-hidden className="size-4" strokeWidth={3} />
      {label}
    </Button>
  );
}
