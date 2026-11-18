import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie presence). Real auth happens in route
// handlers and the (app) layout via getSessionUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|sign-in|\\.well-known|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
