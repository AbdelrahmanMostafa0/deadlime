import * as Sentry from "@sentry/nextjs";

// Server + edge error tracking. A no-op when NEXT_PUBLIC_SENTRY_DSN is unset,
// so local dev and preview builds run without a Sentry project.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

export const onRequestError = Sentry.captureRequestError;
