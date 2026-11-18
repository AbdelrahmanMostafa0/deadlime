"use client";

import {
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import type { TaskStatus } from "@/lib/domain";
import { columnOf, moveAcross, type Columns } from "./board-columns";
import { FinePointerSensor } from "./fine-pointer-sensor";

type Drag = { activeId: string; from: TaskStatus; items: Columns };

/** A finished drop: the card, where it came from and the visible order of its new column. */
export type Drop = { taskId: string; from: TaskStatus; to: TaskStatus; visibleOrder: string[] };

/**
 * Multi-column sortable state. While a card is dragged the board renders a local
 * copy of the columns (so the card can hop between them); otherwise it renders
 * straight from the query cache.
 */
export function useBoardDnd(columns: Columns, onDrop: (drop: Drop) => void) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const sensors = useSensors(
    useSensor(FinePointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const from = columnOf(columns, active.id);
    if (from) setDrag({ activeId: String(active.id), from, items: columns });
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDrag((d) => {
      if (!d) return d;
      const items = moveAcross(d.items, String(active.id), over.id);
      return items === d.items ? d : { ...d, items };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDrag(null);
    if (!drag || !over) return;
    const id = String(active.id);
    const to = columnOf(drag.items, id);
    if (!to) return;
    const list = drag.items[to];
    const overIndex = list.indexOf(String(over.id));
    const visibleOrder = overIndex >= 0 ? arrayMove(list, list.indexOf(id), overIndex) : list;
    if (to === drag.from && visibleOrder.join() === columns[to].join()) return;
    onDrop({ taskId: id, from: drag.from, to, visibleOrder });
  };

  return {
    items: drag?.items ?? columns,
    activeId: drag?.activeId ?? null,
    sensors,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: () => setDrag(null) },
  };
}
