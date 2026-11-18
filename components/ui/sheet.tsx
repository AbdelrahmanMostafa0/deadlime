"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { releaseModalToasts } from "@/lib/toast";
import { AppToaster } from "./toaster";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
  /** "sheet" = bottom sheet on mobile, centered on desktop. "palette" = top-anchored. */
  variant?: "sheet" | "palette";
};

/**
 * Native <dialog> modal: focus trap, Esc to close, inert background and
 * top-layer stacking for free. Bottom sheet on mobile, centered card from md up.
 */
export function Sheet({ open, onOpenChange, title, hideTitle, children, className, variant = "sheet" }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // A text-selection drag that ends on the backdrop must not close the sheet.
  const pressedBackdrop = useRef(false);

  // Sync React state with the browser's dialog (external system).
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => {
        releaseModalToasts();
        onOpenChange(false);
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onOpenChange(false); // backdrop click
        pressedBackdrop.current = false;
      }}
      className={cn(
        "m-0 max-h-[92dvh] w-full max-w-none overflow-hidden border-ink bg-paper p-0 text-ink",
        "open:animate-land",
        variant === "sheet" &&
          "mt-auto rounded-t-sheet border-x-2 border-t-[2.5px] md:m-auto md:max-w-2xl md:rounded-sheet md:border-[2.5px] md:shadow-pop-xl",
        variant === "palette" &&
          "mx-auto mt-[8dvh] max-w-[calc(100%-32px)] rounded-sheet border-[2.5px] shadow-pop-xl md:max-w-[780px]",
        className,
      )}
    >
      <div className="flex max-h-[92dvh] flex-col">
        <header className={cn("flex items-center gap-3 px-5 pt-4 pb-2", hideTitle && "sr-only")}>
          <h2 className="font-display-tight flex-1 text-lg font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="grid size-11 place-items-center rounded-btn border-2 border-ink bg-card transition-spring hover:-rotate-6 hover:bg-lime"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
      {/* The open dialog makes the page inert; lib/toast.ts routes toasts here meanwhile. */}
      {open && <AppToaster modal />}
    </dialog>
  );
}
