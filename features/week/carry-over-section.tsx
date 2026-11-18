import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/tags";
import type { ProjectDTO, WeekReviewDTO } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import { TaskLine } from "./task-lines";

type OpenTask = WeekReviewDTO["open"][number];

export function CarryOverSection({
  items,
  projects,
  dropped,
  onToggle,
}: {
  items: OpenTask[];
  projects: Map<string, ProjectDTO>;
  dropped: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <Panel aria-labelledby="carry-title">
      <div>
        <Label>Carry-over</Label>
        <h2 id="carry-title" className="font-display-tight mt-2 text-xl font-extrabold">
          Still on the plate.
        </h2>
        <p className="mt-1.5 text-sm text-ink-2">Keep it for next week or kick it back to Backlog.</p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Plate is clean." body="Nothing left over. Enjoy the weirdness." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((t) => {
            const drop = dropped.has(t.id);
            return (
              <li key={t.id} className="rounded-card border-2 border-ink bg-card px-3 py-2.5">
                <TaskLine
                  title={t.title}
                  project={t.projectId ? projects.get(t.projectId) : undefined}
                  trailing={
                    <button
                      type="button"
                      aria-pressed={drop}
                      onClick={() => onToggle(t.id)}
                      className={cn(
                        "transition-spring min-h-11 rounded-chip border-2 border-ink px-3.5 text-xs font-bold",
                        drop ? "bg-pink" : "bg-lime",
                      )}
                    >
                      <span className="sr-only">{t.title}: </span>
                      {drop ? "Drop to backlog" : "Keep"}
                    </button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
