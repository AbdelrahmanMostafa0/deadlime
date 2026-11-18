"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { Bold, Code, Heading2, Italic, List, ListOrdered, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Tool = { label: string; icon: LucideIcon; active: (e: Editor) => boolean; run: (e: Editor) => void };

const TOOLS: Tool[] = [
  { label: "Bold", icon: Bold, active: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  {
    label: "Italic",
    icon: Italic,
    active: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "Heading",
    icon: Heading2,
    active: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Bullet list",
    icon: List,
    active: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    active: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  { label: "Code", icon: Code, active: (e) => e.isActive("code"), run: (e) => e.chain().focus().toggleCode().run() },
];

/** Formatting buttons. Subscribes to editor state so the pressed states stay in sync. */
export function EditorToolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({ editor, selector: ({ editor: e }) => TOOLS.map((t) => t.active(e)) });

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-1 border-b-2 border-ink p-1.5">
      {TOOLS.map((tool, i) => (
        <button
          key={tool.label}
          type="button"
          aria-label={tool.label}
          aria-pressed={active[i]}
          // Keep focus (and the selection) in the editor.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => tool.run(editor)}
          className={cn(
            "grid size-11 place-items-center rounded-[10px] border-2 border-transparent transition-spring md:size-9",
            "hover:border-ink hover:bg-card aria-pressed:border-ink aria-pressed:bg-lime",
          )}
        >
          <tool.icon aria-hidden className="size-4" strokeWidth={2.5} />
        </button>
      ))}
    </div>
  );
}
