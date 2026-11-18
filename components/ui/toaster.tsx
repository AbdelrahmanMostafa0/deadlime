"use client";

import { Toaster } from "sonner";

/**
 * The app's toast stack. Mounted once in Providers and again inside modal
 * sheets: a modal <dialog> sits in the top layer and makes the page inert,
 * so Undo buttons from the page-level toaster can't be seen or clicked.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={{ bottom: 96 }}
      mobileOffset={{ bottom: 96 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-chip border-2 border-ink bg-ink px-4 py-2.5 font-sans text-sm font-semibold text-paper shadow-pop-sm md:w-[356px]",
          title: "flex-1",
          actionButton:
            "min-h-9 rounded-chip border-2 border-paper bg-lime px-3 text-[13px] font-bold text-ink transition-spring hover:-rotate-3",
          error: "bg-pink text-ink",
        },
      }}
    />
  );
}
