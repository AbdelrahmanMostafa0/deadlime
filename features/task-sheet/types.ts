import type { TaskUpdateInput } from "@/lib/validation";

/** Save a partial task. `silent` skips the Undo toast (typing, small list edits). */
export type SaveTask = (patch: TaskUpdateInput, opts?: { silent?: boolean }) => void;
