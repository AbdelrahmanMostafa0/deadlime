"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";

type DragHandleProps = {
  label: string;
  attributes: DraggableAttributes;
  /** Keyboard + touch listeners. Mouse drags start from the whole card instead. */
  listeners: DraggableSyntheticListeners;
  activatorRef: (node: HTMLElement | null) => void;
};

/** Stop a touch on the handle from also starting the card's swipe gesture (motion listens natively). */
function stopTouchSwipe(event: PointerEvent) {
  if (event.pointerType === "touch") event.stopPropagation();
}

export const boardControl =
  "grid size-11 shrink-0 place-items-center rounded-btn border-2 border-ink bg-card text-ink shadow-pop-xs transition-spring pointer-fine:size-8 pointer-fine:rounded-[10px]";

/** Grip button: long-press to drag on touch, space/enter to drag with the keyboard. */
export function DragHandle({ label, attributes, listeners, activatorRef }: DragHandleProps) {
  const ref = (node: HTMLButtonElement | null) => {
    activatorRef(node);
    if (!node) return;
    node.addEventListener("pointerdown", stopTouchSwipe);
    return () => {
      node.removeEventListener("pointerdown", stopTouchSwipe);
      activatorRef(null);
    };
  };

  return (
    <button
      ref={ref}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={label}
      className={cn(boardControl, "cursor-grab touch-none hover:bg-lime active:cursor-grabbing")}
    >
      <GripVertical aria-hidden className="size-4" />
    </button>
  );
}
