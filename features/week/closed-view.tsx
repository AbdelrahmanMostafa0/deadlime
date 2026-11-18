"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/tags";
import type { ReviewSnapshot } from "@/lib/domain";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-card border-2 border-ink bg-card p-3 text-center">
      <p className="font-display-tight text-[34px] leading-none font-black">{value}</p>
      <Label className="mt-2 block">{label}</Label>
    </div>
  );
}

/** Celebration plus the frozen snapshot of a closed week. Read-only. */
export function ClosedView({
  snapshot,
  notes,
  onReviewAgain,
}: {
  snapshot: ReviewSnapshot;
  notes: string;
  onReviewAgain: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={reduce ? false : { scale: 0.6, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: reduce ? 0 : -1.5, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 14 }}
      >
        <Card tone="lime" className="flex flex-col items-start gap-3 p-5">
          <span className="grid size-12 place-items-center rounded-full border-2 border-ink bg-card">
            <Check aria-hidden className="size-6" />
          </span>
          <h2 className="font-display-tight text-3xl leading-tight font-black">Week closed.</h2>
          <p className="text-base text-ink-2">See you next week.</p>
        </Card>
      </motion.div>
      <div className="flex gap-3">
        <Stat label="Done" value={snapshot.done.length} />
        <Stat label="Slipped" value={snapshot.slipped.length} />
        <Stat label="Carried" value={snapshot.carriedOver.length} />
      </div>
      {notes && (
        <Card className="p-4">
          <Label>Your notes</Label>
          <p className="mt-2 text-sm whitespace-pre-wrap">{notes}</p>
        </Card>
      )}
      <div>
        <Button onClick={onReviewAgain}>Review again</Button>
      </div>
    </div>
  );
}
