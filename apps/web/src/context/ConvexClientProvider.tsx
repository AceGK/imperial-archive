"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
// aliased in next.config.ts: the package only exposes it through its server provider
import { ConvexAuthNextjsClientProvider, type ConvexAuthServerState } from "@convex-dev/auth/nextjs/client";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import AuthSessionSync from "./AuthSessionSync";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Convex with Convex Auth, without reading cookies on the server: pages stay
 * static and cacheable. With no server state the provider starts from the
 * session it keeps in localStorage, and AuthSessionSync settles it against
 * the cookies when they may differ. Sign-in, sign-out and token refreshes
 * still go through the /api/auth proxy and its httpOnly cookies, which the
 * middleware uses to guard /account and /admin.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsClientProvider
      // optional at runtime; the type says otherwise because the server provider always passes it
      serverState={undefined as unknown as ConvexAuthServerState}
      // the middleware exchanges OAuth codes and redirects without ?code first
      shouldHandleCode={false}
    >
      <ConvexAuthNextjsProvider client={convex}>
        <AuthSessionSync />
        {children}
      </ConvexAuthNextjsProvider>
    </ConvexAuthNextjsClientProvider>
  );
}
