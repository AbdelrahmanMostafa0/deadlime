import { PartyPopper } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/card";
import { Label } from "@/components/ui/tags";
import type { ProjectDTO } from "@/lib/api-types";
import { copy } from "@/lib/copy";
import { TaskLine } from "./task-lines";

export function DoneSection({
  items,
  projects,
}: {
  items: { id: string; title: string; projectId: string | null }[];
  projects: Map<string, ProjectDTO>;
}) {
  return (
    <Panel aria-labelledby="done-title" className="bg-lime-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Done</Label>
          <h2 id="done-title" className="font-display-tight mt-2 text-xl font-extrabold">
            Look at you.
          </h2>
        </div>
        <span className="font-display-tight flex items-center gap-2 text-[34px] leading-none font-black">
          <PartyPopper aria-hidden className="size-6" />
          {items.length}
          <span className="sr-only"> done</span>
        </span>
      </div>
      {items.length === 0 ? (
        <EmptyState title={copy.empty.done.title} body={copy.empty.done.body} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <li key={t.id} className="rounded-card border-2 border-ink bg-card px-3 py-2.5">
              <TaskLine title={t.title} project={t.projectId ? projects.get(t.projectId) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
