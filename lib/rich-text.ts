import type { RichDoc, RichNode } from "./domain";

// Tiptap JSON is the stored format. These helpers convert to and from plain
// text without a DOM, for MCP tools, search and card previews.

const BLOCKS = new Set(["paragraph", "heading", "listItem", "blockquote", "codeBlock"]);

export function docToText(doc: RichDoc | null | undefined): string {
  if (!doc?.content) return "";
  const out: string[] = [];
  const walk = (node: RichNode, prefix = "") => {
    if (node.type === "text") {
      out.push(node.text ?? "");
      return;
    }
    if (node.type === "hardBreak") {
      out.push("\n");
      return;
    }
    if (node.type === "listItem") out.push(prefix);
    node.content?.forEach((child, i) =>
      walk(child, node.type === "orderedList" ? `${i + 1}. ` : node.type === "bulletList" ? "- " : prefix),
    );
    if (BLOCKS.has(node.type) && node.type !== "listItem") out.push("\n");
  };
  doc.content.forEach((n) => walk(n));
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

/** Plain text (one paragraph per line, "- " lines become a bullet list). */
export function textToDoc(text: string): RichDoc | null {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (!text.trim()) return null;
  const content: RichNode[] = [];
  let bullets: RichNode[] = [];
  const flush = () => {
    if (bullets.length) content.push({ type: "bulletList", content: bullets });
    bullets = [];
  };
  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets.push({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: bullet[1] }] }],
      });
      continue;
    }
    flush();
    content.push(
      line.trim()
        ? { type: "paragraph", content: [{ type: "text", text: line }] }
        : { type: "paragraph" },
    );
  }
  flush();
  return { type: "doc", content };
}
