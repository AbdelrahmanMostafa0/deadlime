import * as chrono from "chrono-node";
import { format, parseISO } from "date-fns";

/** "tomorrow", "next fri", "dec 5" -> "yyyy-MM-dd", or null if chrono can't read it. */
export function parseDueInput(text: string, now: Date = new Date()): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const date = chrono.parseDate(trimmed, now, { forwardDate: true });
  return date ? format(date, "yyyy-MM-dd") : null;
}

/** Long, unambiguous form for the live preview: "Thu 19 Nov 2026". */
export function formatDuePreview(iso: string) {
  return format(parseISO(iso), "EEE d MMM yyyy");
}
