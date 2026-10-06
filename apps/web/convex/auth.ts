import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { PasswordResetEmail, VerificationEmail } from "./authEmails";
import { oauthProviders } from "./oauth";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ...oauthProviders,
    Password({
      // Lowercase so the same address always maps to one account (and matches OAuth emails later).
      // Runs for every flow, so sign-in, reset, and verification are normalized too.
      profile(params) {
        if (typeof params.email !== "string") {
          throw new ConvexError("Email is required.");
        }
        return { email: params.email.trim().toLowerCase() };
      },
      reset: PasswordResetEmail,
      verify: VerificationEmail,
    }),
  ],
});
