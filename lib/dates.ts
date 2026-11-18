import { addDays, format, parseISO, startOfWeek } from "date-fns";

// All "calendar" dates are ISO strings (yyyy-MM-dd) with no time zone.
// "Today" is computed in the user's time zone (sent by the browser as the
// x-timezone header) so a task due "today" is correct after midnight UTC.

export type ISODate = string;

export function todayISO(timeZone?: string, now: Date = new Date()): ISODate {
  try {
    // en-CA formats as yyyy-MM-dd.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return format(now, "yyyy-MM-dd");
  }
}

/** Monday of the week containing `date`. Weeks run Monday to Sunday. */
export function weekStartISO(date: ISODate): ISODate {
  return format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function weekEndISO(date: ISODate): ISODate {
  return addDaysISO(weekStartISO(date), 6);
}

export function addDaysISO(date: ISODate, days: number): ISODate {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export function isInWeekOf(date: ISODate, reference: ISODate): boolean {
  return date >= weekStartISO(reference) && date <= weekEndISO(reference);
}
