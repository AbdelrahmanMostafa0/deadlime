import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

type ShellUser = { name: string; image?: string | null };

/** Sidebar on desktop, bottom nav on mobile, dotted paper behind content. */
export function AppShell({ user, children, overlays }: { user: ShellUser; children: ReactNode; overlays?: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar user={user} />
      <main id="main" className="bg-dots min-w-0 flex-1 px-4 pt-6 pb-32 md:px-8 md:pt-8 md:pb-14">
        {children}
      </main>
      <BottomNav user={user} />
      {overlays}
    </div>
  );
}

/** Page title block used at the top of every screen. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <span className="label-mono text-ink">{eyebrow}</span>}
        <h1 className="font-display-tight mt-2 text-[34px] leading-none font-extrabold md:text-[44px]">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
