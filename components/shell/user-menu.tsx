"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

type UserMenuProps = {
  user: { name: string; image?: string | null };
  /** Called when the profile link is followed (e.g. to close the mobile sheet). */
  onNavigate?: () => void;
};

export function UserMenu({ user, onNavigate }: UserMenuProps) {
  const router = useRouter();
  const qc = useQueryClient();

  const signOut = async () => {
    await authClient.signOut();
    qc.clear(); // never show one account's cache to the next
    router.replace("/sign-in");
  };

  return (
    <div className="flex items-center gap-1 rounded-btn">
      <Link
        href="/settings"
        onClick={onNavigate}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-btn border-2 border-transparent px-1.5 hover:border-ink hover:bg-card"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar from OAuth provider, any host
          <img src={user.image} alt="" className="size-8 rounded-full border-2 border-ink" />
        ) : (
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-full border-2 border-ink bg-sun font-bold"
          >
            {user.name.slice(0, 1)}
          </span>
        )}
        <span className="flex-1 truncate text-sm font-semibold">{user.name}</span>
      </Link>
      <button
        type="button"
        onClick={signOut}
        aria-label="Sign out"
        className="grid size-11 place-items-center rounded-btn border-2 border-transparent hover:border-ink hover:bg-card"
      >
        <LogOut aria-hidden className="size-5" />
      </button>
    </div>
  );
}
