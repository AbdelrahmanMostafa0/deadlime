"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjects } from "@/features/projects/api";
import { cn } from "@/lib/cn";
import { addDaysISO } from "@/lib/dates";
import { useToday } from "@/lib/use-today";
import { useUiStore } from "@/stores/ui";
import { Kbd, Label } from "@/components/ui/tags";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { UserMenu } from "./user-menu";

const STALE_DAYS = 14;

/** Desktop navigation (md and up). */
export function Sidebar({ user }: { user: { name: string; image?: string | null } }) {
  const pathname = usePathname();
  const openPalette = useUiStore((s) => s.openPalette);
  const { data: projects } = useProjects();
  const staleBefore = addDaysISO(useToday(), -STALE_DAYS);

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-e-2 border-ink bg-paper-2 px-4 py-6 md:flex">
      <Link href="/today" className="px-1.5" aria-label="Deadlime home">
        <Logo />
      </Link>

      <nav aria-label="Sections" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-btn border-2 border-transparent px-3 text-[15px] font-semibold transition-spring",
                active ? "border-ink bg-lime shadow-pop-sm" : "hover:translate-x-[3px] hover:border-ink hover:bg-card",
              )}
            >
              <Icon aria-hidden className="size-5" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1">
        <Label className="px-3 pb-2">Projects</Label>
        {projects?.map((p) => {
          const stale = p.status === "active" && p.lastActivityAt.slice(0, 10) < staleBefore;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex min-h-9 items-center gap-2.5 rounded-xl px-3 text-sm font-medium hover:bg-card"
            >
              <span aria-hidden className="size-3 rounded-full border-2 border-ink" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
              <span className={cn("ms-auto font-mono text-xs", stale ? "text-danger" : "text-ink-3")}>
                {stale ? <span title="oh, you again?">stale</span> : p.openCount}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={() => openPalette()}
          className="flex min-h-11 items-center justify-between rounded-chip border-2 border-ink bg-card ps-4 pe-2 text-sm font-bold shadow-pop-sm transition-spring hover:-translate-y-0.5"
        >
          Search or do stuff
          <span className="flex gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
