"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addDaysISO, weekStartISO, type ISODate } from "@/lib/dates";
import { useToday } from "@/lib/use-today";
import { resolveWeek } from "./week-label";

/** The week under review, kept in `?week=` so it survives reloads and links. */
export function useWeekParam() {
  const today = useToday();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const week = resolveWeek(params.get("week"), today);
  const currentWeek = weekStartISO(today);

  const go = (target: ISODate) => {
    const next = new URLSearchParams(params.toString());
    if (target === currentWeek) next.delete("week");
    else next.set("week", target);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return {
    today,
    week,
    isCurrent: week === currentWeek,
    prev: () => go(addDaysISO(week, -7)),
    next: () => go(addDaysISO(week, 7)),
    reset: () => go(currentWeek),
  };
}
