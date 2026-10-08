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

export const codeEmails = {
  passwordReset: (code: string) => ({
    subject: "Your Imperial Archive password reset code",
    text: `Your password reset code is ${code}\n\nThis code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request a reset, you can ignore this email.`,
  }),
  verification: (code: string) => ({
    subject: "Verify your Imperial Archive email",
    text: `Your verification code is ${code}\n\nThis code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
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
