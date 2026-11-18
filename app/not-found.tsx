import Link from "next/link";
import { LogoMark } from "@/components/shell/logo";

export default function NotFound() {
  return (
    <main className="bg-dots grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-sheet border-[2.5px] border-ink bg-paper p-8 text-center shadow-pop-xl">
        <LogoMark className="size-14 -rotate-12" />
        <h1 className="font-display-tight text-3xl font-extrabold">404. Squeezed dry.</h1>
        <p className="text-ink-2">This page doesn&apos;t exist. Like your free time.</p>
        <Link
          href="/today"
          className="inline-flex min-h-11 items-center rounded-chip border-2 border-ink bg-lime px-5 font-bold shadow-pop-sm"
        >
          Back to Today
        </Link>
      </div>
    </main>
  );
}
