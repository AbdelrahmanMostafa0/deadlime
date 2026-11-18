"use client";

import { toast } from "sonner";

/** Success toast with an Undo button. Used for every move, done and delete. */
export function toastUndo(message: string, onUndo: () => void | Promise<unknown>) {
  toast(message, {
    duration: 5000,
    action: {
      label: "Undo",
      onClick: () => {
        void onUndo();
      },
    },
  });
}
