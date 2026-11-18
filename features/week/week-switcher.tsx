import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/tags";
import type { ISODate } from "@/lib/dates";
import { weekLabel, weekRelation } from "./week-label";

const CAPTION = { last: "Last week", this: "This week", next: "Next week", other: "Another week" } as const;

export function WeekSwitcher({
  week,
  today,
  onPrev,
  onNext,
  onReset,
}: {
  week: ISODate;
  today: ISODate;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const relation = weekRelation(week, today);
  return (
    <div className="mb-6 flex items-center gap-2">
      <Button size="icon" aria-label="Previous week" onClick={onPrev}>
        <ChevronLeft aria-hidden className="size-5" />
      </Button>
      <div className="min-w-0 flex-1 text-center" aria-live="polite">
        <Label>{CAPTION[relation]}</Label>
        <p className="font-display-tight mt-1.5 truncate text-[15px] font-extrabold md:text-lg">{weekLabel(week)}</p>
      </div>
      {relation !== "this" && (
        <Button size="md" variant="ghost" onClick={onReset}>
          This week
        </Button>
      )}
      <Button size="icon" aria-label="Next week" onClick={onNext}>
        <ChevronRight aria-hidden className="size-5" />
      </Button>
    </div>
  );
}
