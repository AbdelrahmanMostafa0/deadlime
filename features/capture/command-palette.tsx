"use client";

import { Sheet } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui";
import { PaletteBody } from "./palette-body";

/** ⌘K palette: quick capture with inline parsing, plus search and navigation. */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const closePalette = useUiStore((s) => s.closePalette);
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && closePalette()}
      title="Command palette"
      hideTitle
      variant="palette"
    >
      {open && <PaletteBody />}
    </Sheet>
  );
}
