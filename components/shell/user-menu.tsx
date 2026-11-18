"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function UserMenu({ user }: { user: { name: string; image?: string | null } }) {
  const router = useRouter();
  const qc = useQueryClient();

  const signOut = async () => {
    await authClient.signOut();
    qc.clear(); // never show one account's cache to the next
    router.replace("/sign-in");
  };

  return (
    <div className="flex items-center gap-2.5 rounded-btn px-1.5">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar from OAuth provider, any host
        <img src={user.image} alt="" className="size-8 rounded-full border-2 border-ink" />
      ) : (
        <span aria-hidden className="grid size-8 place-items-center rounded-full border-2 border-ink bg-sun font-bold">
          {user.name.slice(0, 1)}
        </span>
      )}
      <span className="flex-1 truncate text-sm font-semibold">{user.name}</span>
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
