import { ConvexError } from "convex/values";
import type { ConvexCredentialsConfig } from "@convex-dev/auth/server";

// Cloudflare Turnstile bot check. Requires TURNSTILE_SECRET_KEY on the Convex deployment
// (Cloudflare's always-pass test secret on dev, the real one on prod).

/** Sent as the ConvexError data, so the client can tell this apart from other auth errors. */
export const TURNSTILE_FAILED = "TurnstileFailed";

// Flows an anonymous visitor can use to create an account, guess a password, or send an
// email (signIn also resends the verification code for an unverified account)
const PROTECTED_FLOWS = new Set(["signUp", "signIn", "reset"]);

export async function verifyTurnstile(token: unknown) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("Turnstile is not configured: set TURNSTILE_SECRET_KEY");
  }
  if (typeof token !== "string" || !token) {
    throw new ConvexError(TURNSTILE_FAILED);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
  });
  const result = (await response.json()) as { success: boolean; "error-codes"?: string[] };
  if (!result.success) {
    console.warn("Turnstile rejected a token:", result["error-codes"]);
    throw new ConvexError(TURNSTILE_FAILED);
  }
}

/**
 * Requires a `turnstileToken` param for the protected Password flows.
 * Password() keeps its real authorize in the provider's internal `options`, which
 * Convex Auth merges over the top-level fields, so that is the one to wrap.
 */
export function withTurnstile(provider: ConvexCredentialsConfig): ConvexCredentialsConfig {
  const options = (provider as unknown as { options: ConvexCredentialsConfig }).options;
  const authorize: ConvexCredentialsConfig["authorize"] = async (params, ctx) => {
    if (typeof params.flow === "string" && PROTECTED_FLOWS.has(params.flow)) {
      await verifyTurnstile(params.turnstileToken);
    }
    return options.authorize(params, ctx);
  };
  return { ...provider, options: { ...options, authorize } } as ConvexCredentialsConfig;
}
