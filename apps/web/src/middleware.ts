import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { findRedirect } from "@/lib/redirects";

const isSignInPage = createRouteMatcher(["/login", "/signup"]);
const isProtectedRoute = createRouteMatcher(["/account(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const redirect = await findRedirect(request.nextUrl.pathname);
  if (redirect) {
    const target = new URL(redirect.destination, request.nextUrl.origin);
    // carry over query strings (?ref=…, utm tags) unless the destination sets its own
    if (!target.search) target.search = request.nextUrl.search;
    return NextResponse.redirect(target, redirect.permanent ? 308 : 307);
  }

  // Redirect authenticated users away from sign-in pages
  if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/account");
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  return NextResponse.next();
});

export const config = {
  /*
  * Match all request paths except for the ones starting with:
  * - _next/static (static files)
  * - _next/image (image optimization files)
  * - favicon.ico (favicon file)
  * - public files (images, etc.)
  */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
