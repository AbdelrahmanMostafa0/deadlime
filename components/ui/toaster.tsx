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
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-card border-2 border-ink bg-card py-2 ps-4 pe-2 font-sans text-[15px] font-bold text-ink shadow-pop md:w-[380px]",
          title: "flex-1 leading-snug",
          actionButton:
            "min-h-10 shrink-0 rounded-btn border-2 border-ink bg-lime px-4 text-sm font-bold text-ink shadow-pop-sm transition-spring hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
          error: "bg-pink text-ink",
        },
      }}
    />
  );
}
