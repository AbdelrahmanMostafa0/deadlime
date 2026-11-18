import { create } from "zustand";
import type { TaskStatus } from "@/lib/domain";

/**
 * UI-only state shared across distant components (shell, palette, sheets).
 * Server data never lives here; that is TanStack Query's job.
 */
type UiState = {
  paletteOpen: boolean;
  /** Prefill for the palette input (e.g. "#pharmacy " from a project page). */
  palettePrefill: string;
  /** Status new tasks default to (e.g. a board column's "+"), or null for This Week. */
  paletteStatus: TaskStatus | null;
  openPalette: (prefill?: string, status?: TaskStatus) => void;
  closePalette: () => void;

  /** Task open in the editor sheet, or null. */
  editingTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  palettePrefill: "",
  paletteStatus: null,
  openPalette: (prefill = "", status) => set({ paletteOpen: true, palettePrefill: prefill, paletteStatus: status ?? null }),
  closePalette: () => set({ paletteOpen: false, palettePrefill: "", paletteStatus: null }),

  editingTaskId: null,
  openTask: (id) => set({ editingTaskId: id }),
  closeTask: () => set({ editingTaskId: null }),
}));
