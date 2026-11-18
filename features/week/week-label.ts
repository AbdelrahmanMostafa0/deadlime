import { format, getISOWeek, isValid, parseISO } from "date-fns";
import { addDaysISO, weekStartISO, type ISODate } from "@/lib/dates";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Monday of the week named by the `?week=` param; falls back to the current week on junk. */
export function resolveWeek(param: string | null, today: ISODate): ISODate {
  if (param && ISO_DATE.test(param) && isValid(parseISO(param))) return weekStartISO(param);
  return weekStartISO(today);
}

/** "Week 47 · 16–22 Nov", or "Week 48 · 30 Nov – 6 Dec" across a month boundary. */
export function weekLabel(weekStart: ISODate): string {
  const start = parseISO(weekStart);
  const end = parseISO(addDaysISO(weekStart, 6));
  const range =
    start.getMonth() === end.getMonth()
      ? `${format(start, "d")}–${format(end, "d MMM")}`
      : `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  return `Week ${getISOWeek(start)} · ${range}`;
}

/** Short relative name for the switcher caption. */
export function weekRelation(weekStart: ISODate, today: ISODate): "last" | "this" | "next" | "other" {
  const current = weekStartISO(today);
  if (weekStart === current) return "this";
  if (weekStart === addDaysISO(current, -7)) return "last";
  if (weekStart === addDaysISO(current, 7)) return "next";
  return "other";
}
