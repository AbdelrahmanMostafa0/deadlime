"use client";

import { useEffect, type RefObject } from "react";

/** Anything that already means something under the mouse: cards (dnd), buttons, links, fields. */
const INTERACTIVE = "li, button, a, input, select, textarea, [role='button']";
const THRESHOLD = 4;

/**
 * Mouse users pan the board sideways by dragging empty space (column
 * backgrounds, headers, gaps), like a whiteboard. Touch keeps native scrolling.
 * Also covers a narrow desktop window, where the board pages one column at a time.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; scroll: number; id: number } | null = null;
    let panning = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as Element).closest(INTERACTIVE)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      start = { x: e.clientX, scroll: el.scrollLeft, id: e.pointerId };
    };
    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      if (!panning && Math.abs(dx) < THRESHOLD) return;
      if (!panning) {
        panning = true;
        el.setPointerCapture(e.pointerId);
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
        // Mandatory snap would yank every scrollLeft write back to a column edge.
        el.style.scrollSnapType = "none";
      }
      el.scrollLeft = start.scroll - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      if (panning && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = "";
      el.style.userSelect = "";
      el.style.scrollSnapType = ""; // snaps to the nearest column again (mobile widths)
      start = null;
      panning = false;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [ref]);
}
