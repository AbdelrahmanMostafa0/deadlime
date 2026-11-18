"use client";

import { Toaster } from "sonner";
import { MODAL_TOASTER_ID } from "@/lib/toast";

/**
 * The app's toast stack. Mounted once in Providers (page) and once inside
 * modal sheets with `modal`: a modal <dialog> makes the page inert, so
 * lib/toast.ts routes toasts to the in-dialog toaster while one is open.
 */
export function AppToaster({ modal = false }: { modal?: boolean }) {
  return (
    <Toaster
      id={modal ? MODAL_TOASTER_ID : undefined}
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
