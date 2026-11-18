import type { Metadata } from "next";
import { Suspense } from "react";
import { Mascot } from "@/components/shell/mascot";
import { SignInButtons } from "@/features/auth/sign-in-buttons";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="bg-dots grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-sheet border-[2.5px] border-ink bg-paper p-8 text-center shadow-pop-xl">
        <Mascot className="-my-2 size-32" priority />
        <div>
          <h1 className="font-display-tight text-4xl font-extrabold">Deadlime</h1>
          <p className="mt-2 text-ink-2">Your projects. Your deadlines. Your problem.</p>
        </div>
        <Suspense>
          <SignInButtons />
        </Suspense>
        <p className="text-xs text-ink-3">We only read your name, email and avatar. Promise.</p>
      </div>
    </main>
  );
}
