import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

// Read per request from the visitor's auth cookie; never cached
export const dynamic = "force-dynamic";

/**
 * The visitor's own Convex access token, read from their httpOnly auth cookie
 * (the middleware refreshes it first when it's close to expiring). Pages used
 * to embed this in the HTML through ConvexAuthNextjsServerProvider, which made
 * every page per-request; now AuthSessionSync asks for it only when the
 * browser's copy may be out of step, such as straight after an OAuth sign-in.
 */
export async function GET(request: Request) {
  // Same-origin fetches only. The middleware also hides the auth cookies from
  // cross-origin requests, so another site would only ever get null here.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return new Response(null, { status: 403 });
  }
  const token = (await convexAuthNextjsToken()) ?? null;
  return Response.json({ token }, { headers: { "Cache-Control": "private, no-store" } });
}
