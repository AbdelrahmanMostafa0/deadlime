import { CalendarCheck, CalendarDays, Columns3, FolderKanban, Inbox, Sun, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; shortcut: string };

/** Order = sidebar order. `shortcut` is the second key after "g" (g t = Today). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun, shortcut: "t" },
  { href: "/week", label: "This Week", icon: CalendarDays, shortcut: "w" },
  { href: "/inbox", label: "Inbox", icon: Inbox, shortcut: "i" },
  { href: "/board", label: "Board", icon: Columns3, shortcut: "b" },
  { href: "/projects", label: "Projects", icon: FolderKanban, shortcut: "p" },
  { href: "/review", label: "Sunday review", icon: CalendarCheck, shortcut: "r" },
];

/** Mobile bottom bar: the four most used, plus "More" and the capture button. */
export const MOBILE_PRIMARY = ["/today", "/board", "/inbox"] as const;

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
