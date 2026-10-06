import { Email } from "@convex-dev/auth/providers/Email";
import { CODE_TTL_MINUTES, codeEmails, generateCode, sendEmail } from "./emails";

// Code-based email providers for the Password provider's `reset` and `verify` options.

export const PasswordResetEmail = Email({
  id: "password-reset",
  maxAge: 60 * CODE_TTL_MINUTES,
  generateVerificationToken: async () => generateCode(),
  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({ to: email, ...codeEmails.passwordReset(token) });
  },
});

export const VerificationEmail = Email({
  id: "email-verification",
  maxAge: 60 * CODE_TTL_MINUTES,
  generateVerificationToken: async () => generateCode(),
  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({ to: email, ...codeEmails.verification(token) });
  },
});
