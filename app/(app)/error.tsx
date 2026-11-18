"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/empty-state";

/** Route-level boundary: keeps the shell (nav) alive when a screen crashes. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorState message="This screen tripped over something. Not you. Probably." onRetry={reset} />;
}
