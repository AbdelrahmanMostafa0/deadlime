import type { Announcements, ScreenReaderInstructions, UniqueIdentifier } from "@dnd-kit/core";

type Describe = {
  /** Title of the dragged task. */
  title: (id: UniqueIdentifier) => string;
  /** Column name for a column id or a task id. */
  column: (id: UniqueIdentifier) => string;
};

/** Screen reader narration for board drags. */
export function boardAnnouncements({ title, column }: Describe): Announcements {
  return {
    onDragStart: ({ active }) => `Picked up "${title(active.id)}" from ${column(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `"${title(active.id)}" is over ${column(over.id)}.` : `"${title(active.id)}" is not over a column.`,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped "${title(active.id)}" in ${column(over.id)}.` : `Dropped "${title(active.id)}". Nothing moved.`,
    onDragCancel: ({ active }) => `Cancelled. "${title(active.id)}" went back where it was.`,
  };
}

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "To pick up a task, focus its drag handle and press space or enter. Use the arrow keys to move it within and between columns. Press space or enter to drop it, or escape to cancel.",
};
