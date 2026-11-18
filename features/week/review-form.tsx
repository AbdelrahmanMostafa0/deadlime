"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import type { WeekReviewDTO } from "@/lib/api-types";
import { useProjectMap } from "@/features/projects/api";
import { useSubmitReview } from "./api";
import { CarryOverSection } from "./carry-over-section";
import { DoneSection } from "./done-section";
import { ProjectBars } from "./project-bars";
import { SlippedSection } from "./slipped-section";

/** Review body for an open week: three sections, notes, sticky "Close the week". */
export function ReviewForm({ review, week, onClosed }: { review: WeekReviewDTO; week: string; onClosed: () => void }) {
  const projects = useProjectMap();
  const submit = useSubmitReview(week);
  const [dropped, setDropped] = useState<ReadonlySet<string>>(new Set());
  const [draft, setDraft] = useState<string | null>(null);
  const notes = draft ?? review.plan.reviewNotes;

  const toggleDrop = (id: string) => {
    const next = new Set(dropped);
    if (!next.delete(id)) next.add(id);
    setDropped(next);
  };

  const doneByProject = new Map<string | null, number>();
  for (const t of review.done) doneByProject.set(t.projectId, (doneByProject.get(t.projectId) ?? 0) + 1);
  const focus = review.plan.activeProjectIds.flatMap((id) => projects.get(id) ?? []);

  const close = () =>
    submit.mutate(
      {
        reviewNotes: notes,
        carryOverIds: review.open.filter((t) => !dropped.has(t.id)).map((t) => t.id),
        dropIds: review.open.filter((t) => dropped.has(t.id)).map((t) => t.id),
      },
      { onSuccess: onClosed },
    );

  return (
    <div className="flex flex-col gap-5">
      <ProjectBars projects={focus} doneByProject={doneByProject} />
      <div className="grid gap-5 lg:grid-cols-3">
        <DoneSection items={review.done} projects={projects} />
        <SlippedSection items={review.slipped} projects={projects} />
        <CarryOverSection items={review.open} projects={projects} dropped={dropped} onToggle={toggleDrop} />
      </div>
      <Field id="review-notes" label="Notes">
        <Textarea
          id="review-notes"
          value={notes}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What went well? What went sideways?"
          maxLength={20000}
        />
      </Field>
      <div className="pb-safe sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 md:bottom-4">
        <Button variant="lime" size="lg" className="w-full md:w-auto" disabled={submit.isPending} onClick={close}>
          {submit.isPending ? "Closing..." : "Close the week"}
        </Button>
      </div>
    </div>
  );
}
