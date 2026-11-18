import { Label } from "@/components/ui/tags";
import type { ProjectDTO } from "@/lib/api-types";

/** Done counts per focus project as plain CSS bars. */
export function ProjectBars({
  projects,
  doneByProject,
}: {
  projects: ProjectDTO[];
  doneByProject: Map<string | null, number>;
}) {
  if (projects.length === 0) return null;
  const max = Math.max(1, ...projects.map((p) => doneByProject.get(p.id) ?? 0));
  return (
    <div className="rounded-card border-2 border-ink bg-card p-4">
      <Label>Done per focus project</Label>
      <ul className="mt-3 flex flex-col gap-2.5">
        {projects.map((p) => {
          const n = doneByProject.get(p.id) ?? 0;
          return (
            <li key={p.id} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate font-bold">{p.name}</span>
              <span aria-hidden className="h-3.5 overflow-hidden rounded-chip border-2 border-ink bg-paper">
                <span
                  className="block h-full border-e-2 border-ink"
                  style={{ width: `${(n / max) * 100}%`, backgroundColor: p.color, display: n ? "block" : "none" }}
                />
              </span>
              <span className="font-mono text-xs font-bold">
                {n}
                <span className="sr-only"> done</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
