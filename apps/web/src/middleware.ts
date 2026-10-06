import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/login", "/signup"]);
const isProtectedRoute = createRouteMatcher(["/account(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
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
