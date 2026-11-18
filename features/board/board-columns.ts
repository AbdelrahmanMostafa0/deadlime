import type { UniqueIdentifier } from "@dnd-kit/core";
import type { TaskDTO } from "@/lib/api-types";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain";

/** Ordered task ids per board column. */
export type Columns = Record<TaskStatus, string[]>;

const isStatus = (id: UniqueIdentifier): id is TaskStatus => (TASK_STATUSES as readonly UniqueIdentifier[]).includes(id);

/** Group tasks into columns, ordered by `order` (stable, so server order breaks ties). */
export function toColumns(tasks: readonly TaskDTO[]): Columns {
  const columns: Columns = { backlog: [], this_week: [], doing: [], waiting: [], done: [] };
  for (const t of [...tasks].sort((a, b) => a.order - b.order)) columns[t.status].push(t.id);
  return columns;
}

/** Column a droppable id belongs to: a column id itself, or the column holding that task. */
export function columnOf(columns: Columns, id: UniqueIdentifier): TaskStatus | undefined {
  if (isStatus(id)) return id;
  return TASK_STATUSES.find((s) => columns[s].includes(String(id)));
}

/** Move `activeId` into the column under `overId` (at the hovered card, or the end). Same object if nothing changes. */
export function moveAcross(columns: Columns, activeId: string, overId: UniqueIdentifier): Columns {
  const from = columnOf(columns, activeId);
  const to = columnOf(columns, overId);
  if (!from || !to || from === to) return columns;
  const target = columns[to];
  const index = target.indexOf(String(overId));
  const at = index >= 0 ? index : target.length;
  return {
    ...columns,
    [from]: columns[from].filter((id) => id !== activeId),
    [to]: [...target.slice(0, at), activeId, ...target.slice(at)],
  };
}

/**
 * Full destination order for the reorder API when only some cards are visible
 * (project filter). The moved card lands right before the visible card that now
 * follows it, or right after the one that precedes it, so hidden cards keep
 * their relative order. Without a filter this returns `visibleOrder` unchanged.
 */
export function mergeOrder(fullColumn: readonly string[], visibleOrder: readonly string[], taskId: string): string[] {
  const base = fullColumn.filter((id) => id !== taskId);
  const i = visibleOrder.indexOf(taskId);
  const next = visibleOrder.slice(i + 1).find((id) => base.includes(id));
  if (next) {
    const at = base.indexOf(next);
    return [...base.slice(0, at), taskId, ...base.slice(at)];
  }
  const prev = visibleOrder
    .slice(0, Math.max(i, 0))
    .reverse()
    .find((id) => base.includes(id));
  if (prev) {
    const at = base.indexOf(prev) + 1;
    return [...base.slice(0, at), taskId, ...base.slice(at)];
  }
  return [...base, taskId];
}
