import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const COOKIE_NAME = "site-access";
const COOKIE_VALUE = "granted";

// Define auth-protected routes (adjust these to your needs)
const isSignInPage = createRouteMatcher(["/login", "/signup"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/profile(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // --- Your existing password protection logic ---
  const accessCookie = request.cookies.get(COOKIE_NAME);

  // Allow password page and verify API
  if (
    request.nextUrl.pathname === "/password" ||
    request.nextUrl.pathname === "/api/verify-password"
  ) {
    return NextResponse.next();
  }

  // If no site access cookie, redirect to password page
  if (accessCookie?.value !== COOKIE_VALUE) {
    return NextResponse.redirect(new URL("/password", request.url));
  }

  // --- Convex Auth logic ---
  // Redirect authenticated users away from sign-in pages
  if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
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