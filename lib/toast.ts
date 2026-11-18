"use client";

import { toast as sonner, type ExternalToast } from "sonner";

/** Id of the toaster rendered inside modal sheets (see components/ui/toaster.tsx). */
export const MODAL_TOASTER_ID = "modal";

// A modal <dialog> sits in the top layer and makes the page inert, so toasts
// from the page-level toaster would be hidden and unclickable. While a dialog is
// open, route toasts to the toaster mounted inside it instead.
const target = (): ExternalToast =>
  typeof document !== "undefined" && document.querySelector("dialog[open]")
    ? { toasterId: MODAL_TOASTER_ID }
    : {};

type Message = Parameters<typeof sonner>[0];

/** Drop-in for sonner's `toast`; always import toasts from here. */
export const toast = Object.assign((message: Message, options?: ExternalToast) => sonner(message, { ...target(), ...options }), {
  error: (message: Message, options?: ExternalToast) => sonner.error(message, { ...target(), ...options }),
  success: (message: Message, options?: ExternalToast) => sonner.success(message, { ...target(), ...options }),
  dismiss: sonner.dismiss,
});
