"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { Panel } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/tags";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/cn";
import { useProjects } from "@/features/projects/api";
import { useSetWeekPlan, useWeekPlan } from "./api";
import { WipStepper } from "./wip-stepper";

export function FocusPanel({ week }: { week: string }) {
  const plan = useWeekPlan(week);
  const projects = useProjects();
  const setPlan = useSetWeekPlan(week);

  if (plan.isError || projects.isError) {
    return (
      <ErrorState
        message={copy.error}
        onRetry={() => {
          void plan.refetch();
          void projects.refetch();
        }}
      />
    );
  }
  if (!plan.data || !projects.data) return <Skeleton className="h-48 w-full rounded-panel" />;

  const active = new Set(plan.data.activeProjectIds);
  const save = (patch: Parameters<typeof setPlan.mutate>[0], message: string) => {
    setPlan.mutate(patch, { onSuccess: () => toast(message) });
  };
  const toggle = (id: string) => {
    const next = active.has(id) ? plan.data.activeProjectIds.filter((p) => p !== id) : [...plan.data.activeProjectIds, id];
    save({ activeProjectIds: next }, active.has(id) ? "Off the hook. For now." : "In focus. No pressure.");
  };

  return (
    <Panel aria-labelledby="focus-title">
      <div>
        <Label>Focus this week</Label>
        <h2 id="focus-title" className="font-display-tight mt-2 text-xl font-extrabold">
          What actually matters?
        </h2>
      </div>
      {projects.data.length === 0 ? (
        <EmptyState
          title={copy.empty.projects.title}
          body={copy.empty.projects.body}
          action={
            <Link href="/projects" className="min-h-11 content-center text-sm font-bold underline underline-offset-4">
              Go make one
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Active projects">
          {projects.data.map((p) => {
            const on = active.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "transition-spring inline-flex min-h-11 items-center gap-2 rounded-chip border-2 border-ink px-3.5 text-sm font-bold",
                    on ? "bg-lime shadow-pop-sm -rotate-1" : "bg-card opacity-80 hover:opacity-100",
                  )}
                >
                  <span aria-hidden className="size-3.5 rounded-full border-2 border-ink" style={{ backgroundColor: p.color }} />
                  {p.name}
                  {on && <Check aria-hidden className="size-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink pt-4">
        <p className="max-w-56 text-sm text-ink-2">Doing limit. More than this and Doing refuses to play along.</p>
        <WipStepper value={plan.data.wipLimit} onChange={(n) => save({ wipLimit: n }, `Limit set to ${n}.`)} />
      </div>
    </Panel>
  );
}
