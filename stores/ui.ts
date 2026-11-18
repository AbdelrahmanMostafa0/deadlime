import { create } from "zustand";

/**
 * UI-only state shared across distant components (shell, palette, sheets).
 * Server data never lives here; that is TanStack Query's job.
 */
type UiState = {
  paletteOpen: boolean;
  /** Prefill for the palette input (e.g. "#pharmacy " from a project page). */
  palettePrefill: string;
  openPalette: (prefill?: string) => void;
  closePalette: () => void;

  /** Task open in the editor sheet, or null. */
  editingTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  palettePrefill: "",
  openPalette: (prefill = "") => set({ paletteOpen: true, palettePrefill: prefill }),
  closePalette: () => set({ paletteOpen: false, palettePrefill: "" }),

  editingTaskId: null,
  openTask: (id) => set({ editingTaskId: id }),
  closeTask: () => set({ editingTaskId: null }),
}));
