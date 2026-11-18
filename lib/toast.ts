"use client";

import { toast as sonner, type ExternalToast } from "sonner";
import { createToastRegistry } from "./toast-registry";

/** Id of the toaster rendered inside modal sheets (see components/ui/toaster.tsx). */
export const MODAL_TOASTER_ID = "modal";

type Message = Parameters<typeof sonner>[0];
type Kind = "default" | "error" | "success";
type Tracked = { kind: Kind; message: Message; options: ExternalToast | undefined };

const modalToasts = createToastRegistry<Tracked>();
let releasing = false;

const emit = (kind: Kind, message: Message, options: ExternalToast | undefined) =>
  kind === "default" ? sonner(message, options) : sonner[kind](message, options);

// A modal <dialog> sits in the top layer and makes the page inert, so toasts
// from the page-level toaster would be hidden and unclickable. While a dialog is
// open, route toasts to the toaster mounted inside it instead.
const inModal = () => typeof document !== "undefined" && !!document.querySelector("dialog[open]");

function show(kind: Kind, message: Message, options?: ExternalToast) {
  if (!inModal()) return emit(kind, message, options);

  const sent: { id?: string | number } = {};
  const forget = () => {
    if (sent.id !== undefined) modalToasts.remove(sent.id);
  };
  // Toasts the user acted on or that timed out must not come back when the dialog closes.
  const wrapped: ExternalToast = {
    ...options,
    toasterId: MODAL_TOASTER_ID,
    onDismiss: (t) => {
      forget();
      if (!releasing) options?.onDismiss?.(t);
    },
    onAutoClose: (t) => {
      forget();
      options?.onAutoClose?.(t);
    },
  };
  if (options?.action && typeof options.action === "object" && "onClick" in options.action) {
    const action = options.action;
    wrapped.action = {
      ...action,
      onClick: (e) => {
        forget();
        action.onClick(e);
      },
    };
  }
  const id = emit(kind, message, wrapped);
  sent.id = id;
  modalToasts.add(id, { kind, message, options }, options?.duration, Date.now());
  return id;
}

/**
 * Call when a modal closes: its toaster unmounts, so toasts still alive are
 * dismissed and re-shown on the page toaster with their remaining time.
 */
export function releaseModalToasts() {
  const alive = modalToasts.drain(Date.now());
  releasing = true;
  try {
    for (const { id, payload, remaining } of alive) {
      sonner.dismiss(id);
      emit(payload.kind, payload.message, { ...payload.options, duration: remaining });
    }
  } finally {
    releasing = false;
  }
}

/** Drop-in for sonner's `toast`; always import toasts from here. */
export const toast = Object.assign((message: Message, options?: ExternalToast) => show("default", message, options), {
  error: (message: Message, options?: ExternalToast) => show("error", message, options),
  success: (message: Message, options?: ExternalToast) => show("success", message, options),
  dismiss: sonner.dismiss,
});
