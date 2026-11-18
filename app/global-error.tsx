"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

/** Last-resort boundary when the root layout itself fails. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-paper p-6 text-ink">
        <main className="flex max-w-sm flex-col items-start gap-3 rounded-sheet border-[2.5px] border-ink bg-card p-8 shadow-pop-xl">
          <h1 className="font-display-tight text-2xl font-extrabold">Well, that broke.</h1>
          <p className="text-ink-2">Not you. Probably. We&apos;ve been told.</p>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-chip border-2 border-ink bg-lime px-5 font-bold shadow-pop-sm"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
