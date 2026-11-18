"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "./dates";

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};
const read = () => todayISO(Intl.DateTimeFormat().resolvedOptions().timeZone);

/** Today's ISO date in the browser's time zone; updates after midnight. */
export function useToday() {
  return useSyncExternalStore(subscribe, read, () => todayISO());
}
