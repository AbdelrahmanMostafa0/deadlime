"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import type { TaskDTO } from "@/lib/api-types";
import type { RichDoc, RichNode } from "@/lib/domain";
import { Skeleton } from "@/components/ui/skeleton";
import { createDebouncer } from "./debounce";
import { EditorToolbar } from "./editor-toolbar";
import type { SaveTask } from "./types";

type DescriptionFieldProps = { task: TaskDTO; onSave: SaveTask };

const SAVE_DELAY = 800;

const toRichDoc = (json: JSONContent): RichDoc => ({ type: "doc", content: json.content as RichNode[] | undefined });

// Prose-like spacing for the editor content, without a typography plugin.
const PROSE = [
  "min-h-32 px-3.5 py-3 text-[15px] leading-relaxed outline-none",
  "[&_p]:my-1.5 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:font-display-tight [&_h2]:text-lg [&_h2]:font-extrabold",
  "[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-bold [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5",
  "[&_li>p]:my-0.5 [&_code]:rounded-md [&_code]:bg-paper-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px]",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-btn [&_pre]:bg-ink [&_pre]:p-3 [&_pre]:text-paper [&_pre_code]:bg-transparent",
  "[&_blockquote]:border-s-4 [&_blockquote]:border-line [&_blockquote]:ps-3 [&_blockquote]:text-ink-2 [&_a]:underline",
].join(" ");

/** Tiptap editor storing JSON. Debounced autosave, flushed on blur and when the sheet closes. */
export function DescriptionField({ task, onSave }: DescriptionFieldProps) {
  const [debouncer] = useState(() => createDebouncer(SAVE_DELAY));
  const labelId = `task-description-${task.id}`;

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: task.description ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: { "aria-labelledby": labelId, "aria-multiline": "true", role: "textbox", class: PROSE },
      // Cmd/Ctrl+Enter toggles done (handled by the sheet), not a hard break.
      handleKeyDown: (_view, event) => (event.metaKey || event.ctrlKey) && event.key === "Enter",
    },
    onUpdate: ({ editor: e }) => {
      const doc = e.isEmpty ? null : toRichDoc(e.getJSON());
      debouncer.schedule(() => {
        if (JSON.stringify(doc) !== JSON.stringify(task.description ?? null)) {
          onSave({ description: doc }, { silent: true });
        }
      });
    },
    onBlur: () => debouncer.flush(),
  });

  // Don't lose the last keystrokes when the sheet closes mid-debounce.
  useEffect(() => () => debouncer.flush(), [debouncer]);

  return (
    <section className="flex flex-col gap-1.5">
      <h3 id={labelId} className="label-mono text-ink">
        Notes
      </h3>
      <div className="overflow-hidden rounded-btn border-2 border-ink bg-card focus-within:shadow-pop-sm">
        {editor ? (
          <>
            <EditorToolbar editor={editor} />
            <div className="relative">
              <EmptyHint editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 p-3.5">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-20" />
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyHint({ editor }: { editor: Editor }) {
  const empty = useEditorState({ editor, selector: ({ editor: e }) => e.isEmpty });
  if (!empty) return null;
  return (
    <p aria-hidden className="pointer-events-none absolute start-3.5 top-3 text-[15px] text-ink-4">
      Context, links, excuses.
    </p>
  );
}
