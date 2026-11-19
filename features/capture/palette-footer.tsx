import { Kbd } from "@/components/ui/tags";

/** Syntax cheat sheet and key hints under the list. */
export function PaletteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t-2 border-ink bg-paper-2 px-5 py-2.5 text-xs text-ink-3">
      <p className="font-mono">
        <b className="text-ink">#project</b> <b className="text-ink">!high/med/low</b>{" "}
        <b className="text-ink">today/tomorrow/fri</b> <b className="text-ink">~s/m/l</b>
      </p>
      <p className="flex items-center gap-1.5">
        <Kbd>↵</Kbd> This Week <Kbd>⇧↵</Kbd> Backlog <Kbd>⌘</Kbd>/<Kbd>Ctrl</Kbd>+<Kbd>↵</Kbd> More options <Kbd>esc</Kbd> close
      </p>
    </footer>
  );
}
