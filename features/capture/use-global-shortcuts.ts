"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { useUiStore } from "@/stores/ui";

const CHORD_MS = 1200;

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Window-level shortcuts: Cmd/Ctrl+K toggles the palette, "c" opens it,
 * "g" then t/w/i/b/p/r/s navigates. Single keys are ignored while typing or
 * while any dialog is open.
 */
export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let chordAt = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUiStore.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (ui.paletteOpen) ui.closePalette();
        else ui.openPalette();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
      if (isTyping(e.target) || document.querySelector("dialog[open]")) return;

      const key = e.key.toLowerCase();
      if (Date.now() - chordAt < CHORD_MS) {
        chordAt = 0;
        const target = NAV_ITEMS.find((n) => n.shortcut === key);
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }
      if (key === "g") chordAt = Date.now();
      else if (key === "c") {
        e.preventDefault();
        ui.openPalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);
}
