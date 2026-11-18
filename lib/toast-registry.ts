export const DEFAULT_TOAST_DURATION = 5000;

type Entry<T> = { payload: T; sentAt: number; duration: number };
type Released<T> = { id: string | number; payload: T; remaining: number };

/**
 * Remembers toasts shown in a modal's toaster so those still alive when the modal
 * closes can be re-shown on the page toaster. Pure: no DOM, no sonner.
 */
export function createToastRegistry<T>() {
  const entries = new Map<string | number, Entry<T>>();

  return {
    add(id: string | number, payload: T, duration: number | undefined, now: number) {
      entries.set(id, { payload, sentAt: now, duration: duration ?? DEFAULT_TOAST_DURATION });
    },
    remove(id: string | number) {
      entries.delete(id);
    },
    /** Entries younger than their duration, with the time they have left. Empties the registry. */
    drain(now: number): Released<T>[] {
      const alive: Released<T>[] = [];
      for (const [id, e] of entries) {
        const remaining = e.duration - (now - e.sentAt);
        if (remaining > 0) alive.push({ id, payload: e.payload, remaining });
      }
      entries.clear();
      return alive;
    },
  };
}
