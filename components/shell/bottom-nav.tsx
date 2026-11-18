"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores/ui";
import { Sheet } from "@/components/ui/sheet";
import { MOBILE_PRIMARY, NAV_ITEMS, isActive } from "./nav-items";
import { UserMenu } from "./user-menu";

// basis-0 keeps all four tabs the same width, so the capture button sits dead center.
const tab =
  "flex min-h-14 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-btn border-2 border-transparent text-[11px] font-bold transition-spring";
const activeTab = "border-ink bg-lime shadow-pop-xs";

/** Mobile navigation: thumb zone, capture button in the middle. */
export function BottomNav({ user }: { user: { name: string; image?: string | null } }) {
  const pathname = usePathname();
  const openPalette = useUiStore((s) => s.openPalette);
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.filter((i) => (MOBILE_PRIMARY as readonly string[]).includes(i.href));
  const more = NAV_ITEMS.filter((i) => !(MOBILE_PRIMARY as readonly string[]).includes(i.href));
  const left = primary.slice(0, 2);
  const right = primary.slice(2);

  const link = ({ href, label, icon: Icon }: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(pathname, href);
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(tab, active && activeTab)}>
        <Icon aria-hidden className="size-[22px]" />
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Sections"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper-2 px-2 pt-1.5 md:hidden"
      >
        <div className="flex items-end gap-1 pb-1.5">
          {left.map(link)}
          <button
            type="button"
            onClick={() => openPalette()}
            aria-label="Capture a task"
            className="mx-1 -mt-6 grid size-16 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-lime shadow-pop transition-spring active:scale-90 active:shadow-none"
          >
            <Plus aria-hidden className="size-7" strokeWidth={3} />
          </button>
          {right.map(link)}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(tab, more.some((i) => isActive(pathname, i.href)) && activeTab)}
          >
            <Menu aria-hidden className="size-[22px]" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="More">
        <nav aria-label="More sections" className="flex flex-col gap-2 px-5 pb-6">
          {more.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex min-h-13 items-center gap-3 rounded-btn border-2 border-ink bg-card px-4 font-semibold shadow-pop-xs",
                isActive(pathname, href) && "bg-lime",
              )}
            >
              <Icon aria-hidden className="size-5" />
              {label}
            </Link>
          ))}
          <div className="mt-2 border-t-2 border-line pt-3">
            <UserMenu user={user} onNavigate={() => setMoreOpen(false)} />
          </div>
        </nav>
      </Sheet>
    </>
  );
}
