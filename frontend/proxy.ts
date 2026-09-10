import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic redirect only: getSessionCookie does not validate the session.
// Real enforcement happens in app/(app)/layout.tsx and route handlers.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat",
    "/documents",
    "/eval",
    "/config",
    "/mailbox",
    "/summary",
    "/radar",
    "/review-hub",
    "/telemetry",
    "/workbench/:path*",
    "/settings",
  ],
};
