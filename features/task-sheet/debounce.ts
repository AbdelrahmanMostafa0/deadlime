/**
 * Trailing debounce that keeps only the latest pending call and can be flushed
 * (blur, unmount). Plain object instead of refs so it lives in useState.
 */
export function createDebouncer(delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: (() => void) | null = null;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const run = pending;
    pending = null;
    run?.();
  };

  return {
    schedule(run: () => void) {
      if (timer) clearTimeout(timer);
      pending = run;
      timer = setTimeout(flush, delay);
    },
    flush,
  };
}
