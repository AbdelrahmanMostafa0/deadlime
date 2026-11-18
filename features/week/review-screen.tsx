"use client";

import { useState } from "react";
import { isSunday, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/app-shell";
import { copy } from "@/lib/copy";
import { ClosedView } from "./closed-view";
import { FocusPanel } from "./focus-panel";
import { ReviewForm } from "./review-form";
import { useWeekReview } from "./api";
import { useWeekParam } from "./use-week-param";
import { WeekSwitcher } from "./week-switcher";

function ReviewBody({ week }: { week: string }) {
  const review = useWeekReview(week);
  // Which week the user chose to re-open; resets itself when the week changes.
  const [reopened, setReopened] = useState<string | null>(null);

  if (review.isError) return <ErrorState message={copy.error} onRetry={() => void review.refetch()} />;
  if (!review.data) {
    return (
      <div role="status" aria-label="Loading review" className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-panel" />
        <Skeleton className="h-64 rounded-panel" />
        <Skeleton className="h-64 rounded-panel" />
      </div>
    );
  }

  const { plan } = review.data;
  if (plan.reviewedAt && plan.reviewSnapshot && reopened !== week) {
    return <ClosedView snapshot={plan.reviewSnapshot} notes={plan.reviewNotes} onReviewAgain={() => setReopened(week)} />;
  }
  return <ReviewForm key={week} review={review.data} week={week} onClosed={() => setReopened(null)} />;
}

export function ReviewScreen() {
  const { today, week, isCurrent, prev, next, reset } = useWeekParam();
  const sunday = isSunday(parseISO(today));

  return (
    <>
      <PageHeader eyebrow="Weekly review" title="Sunday review" subtitle="Count the wins. Face the slips." />
      {sunday && isCurrent && (
        <Card tone="sun" role="status" className="mb-6 px-4 py-3 text-[15px] font-bold">
          It&apos;s Sunday. Time to face the music.
        </Card>
      )}
      <WeekSwitcher week={week} today={today} onPrev={prev} onNext={next} onReset={reset} />
      <div className="flex flex-col gap-6">
        <FocusPanel week={week} />
        <ReviewBody key={week} week={week} />
      </div>
    </>
  );
}
