"use client";

import { useEffect, useState } from "react";

/** `value`, but only after it has stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  // Timer = sync with the outside world; the one legitimate effect here.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
