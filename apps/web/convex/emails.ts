import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Shared email helpers. Requires AUTH_RESEND_KEY and AUTH_EMAIL_FROM on the Convex deployment.

export const CODE_TTL_MINUTES = 15;

/** Random 8-digit numeric code. */
export function generateCode() {
  const digits = crypto.getRandomValues(new Uint32Array(8));
  return Array.from(digits, (n) => (n % 10).toString()).join("");
}

export async function hashCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const SITE = "imperialarchive.com";

// Each email says where it came from and why, so a recipient who didn't ask for
// it knows it's safe to ignore (rather than reporting it as spam)
export const codeEmails = {
  passwordReset: (code: string) => ({
    subject: `${code} is your Imperial Archive password reset code`,
    text: [
      `Someone asked to reset the password for the Imperial Archive account using this email address (${SITE}).`,
      `Your password reset code is: ${code}`,
      `Enter it on the reset page within ${CODE_TTL_MINUTES} minutes.`,
      `If you didn't ask for this, you can ignore this email. Your password won't change unless this code is used.`,
      `Imperial Archive\nhttps://${SITE}`,
    ].join("\n\n"),
  }),
  verification: (code: string) => ({
    subject: `${code} is your Imperial Archive verification code`,
    text: [
      `Someone used this email address with an Imperial Archive account (${SITE}), the Warhammer 40,000 Black Library catalog and reading tracker.`,
      `Your verification code is: ${code}`,
      `Enter it on the site within ${CODE_TTL_MINUTES} minutes to confirm this address.`,
      `If this wasn't you, you can ignore this email. The address won't be verified without this code, and you won't get further emails unless someone requests another code.`,
      `Imperial Archive\nhttps://${SITE}`,
    ].join("\n\n"),
  }),
};

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email is not configured: set AUTH_RESEND_KEY and AUTH_EMAIL_FROM");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!response.ok) {
    throw new Error(`Could not send email: ${await response.text()}`);
  }
}

/**
 * Sends a sample code email. Internal, so only runnable from the dashboard or CLI:
 *   npx convex run emails:sendTest '{"to": "delivered@resend.dev"}'
 *   npx convex run emails:sendTest '{"to": "you@example.com", "type": "verification"}'
 */
export const sendTest = internalAction({
  args: {
    to: v.string(),
    type: v.optional(v.union(v.literal("passwordReset"), v.literal("verification"))),
  },
  handler: async (_ctx, { to, type = "passwordReset" }) => {
    await sendEmail({ to, ...codeEmails[type]("12345678") });
  },
});
