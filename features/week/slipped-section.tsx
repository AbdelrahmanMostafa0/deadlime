import { format, parseISO } from "date-fns";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, Sticker } from "@/components/ui/tags";
import type { ProjectDTO } from "@/lib/api-types";
import { TaskLine } from "./task-lines";

export function SlippedSection({
  items,
  projects,
}: {
  items: { id: string; title: string; projectId: string | null; dueDate: string | null }[];
  projects: Map<string, ProjectDTO>;
}) {
  return (
    <Panel aria-labelledby="slipped-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Slipped</Label>
          <h2 id="slipped-title" className="font-display-tight mt-2 text-xl font-extrabold">
            Due, then not done.
          </h2>
        </div>
        <span className="font-display-tight text-[34px] leading-none font-black">
          {items.length}
          <span className="sr-only"> slipped</span>
        </span>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Nothing slipped." body="Every deadline met. Suspiciously disciplined." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <li key={t.id} className="sour rounded-card border-2 border-ink bg-card px-3 py-2.5">
              <TaskLine
                title={t.title}
                project={t.projectId ? projects.get(t.projectId) : undefined}
                trailing={t.dueDate && <Sticker>was {format(parseISO(t.dueDate), "EEE d")}</Sticker>}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
