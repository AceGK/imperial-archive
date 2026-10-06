import {
  createAccount,
  getAuthSessionId,
  getAuthUserId,
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
// "max" metadata validates real number ranges (area codes etc.), not just length
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { CODE_TTL_MINUTES, codeEmails, generateCode, hashCode, sendEmail } from "./emails";

const PROVIDER = "password";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CODE_ATTEMPTS = 5;
const CODE_RESEND_COOLDOWN_MS = 60 * 1000;

/** The signed-in user's account info, or null when signed out. */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user === null) return null;
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    return {
      email: user.email ?? null,
      emailVerified: user.emailVerificationTime !== undefined,
      image: user.image ?? null,
      // Sign-in methods linked to this user, e.g. ["password", "google"]
      providers: accounts.map((a) => a.provider),
      hasPassword: accounts.some((a) => a.provider === PROVIDER),
      phone: user.phone ?? null,
      createdAt: user._creationTime,
    };
  },
});

type UserSummary = { email: string | null; emailVerified: boolean };

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<UserSummary | null> => {
    const user = await ctx.db.get(userId);
    if (user === null) return null;
    return { email: user.email ?? null, emailVerified: user.emailVerificationTime !== undefined };
  },
});

// Throws a user-facing error unless `password` is correct for the signed-in user.
async function verifyCurrentPassword(ctx: ActionCtx, password: string) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("You must be signed in.");

  const user: UserSummary | null = await ctx.runQuery(internal.users.getUser, { userId });
  const email = user?.email ?? null;
  if (email === null) throw new ConvexError("Account not found.");

  try {
    await retrieveAccount(ctx, {
      provider: PROVIDER,
      account: { id: email, secret: password },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "TooManyFailedAttempts") {
      throw new ConvexError("Too many failed attempts. Try again later.");
    }
    throw new ConvexError("Current password is incorrect.");
  }

  return { userId, email };
}

// Saves a fresh code for the user and emails it to `email`.
async function sendEmailCode(ctx: ActionCtx, userId: Id<"users">, email: string) {
  const code = generateCode();
  await ctx.runMutation(internal.users.saveEmailCode, {
    userId,
    email,
    codeHash: await hashCode(code),
  });
  await sendEmail({ to: email, ...codeEmails.verification(code) });
}

/** Emails a code to the current address so an unverified user can verify it. */
export const startEmailVerification = action({
  args: {},
  handler: async (ctx): Promise<{ email: string }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("You must be signed in.");
    const user: UserSummary | null = await ctx.runQuery(internal.users.getUser, { userId });
    if (!user?.email) throw new ConvexError("Account not found.");
    if (user.emailVerified) throw new ConvexError("Your email is already verified.");

    await sendEmailCode(ctx, userId, user.email);
    return { email: user.email };
  },
});

/** Step 1 of changing email: confirm the password, then email a code to the new address. */
export const startEmailChange = action({
  args: { newEmail: v.string(), currentPassword: v.string() },
  handler: async (ctx, { newEmail, currentPassword }): Promise<{ email: string }> => {
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new ConvexError("Enter a valid email address.");
    }

    const { userId, email: currentEmail } = await verifyCurrentPassword(ctx, currentPassword);
    if (email === currentEmail) {
      throw new ConvexError("That's already your email address.");
    }
    if (await ctx.runQuery(internal.users.isEmailTaken, { userId, email })) {
      throw new ConvexError("That email is already in use.");
    }

    await sendEmailCode(ctx, userId, email);
    return { email };
  },
});

/** Step 2: checks the code, then verifies the current email or switches to the new one. */
export const confirmEmailCode = action({
  args: { code: v.string() },
  handler: async (ctx, { code }): Promise<{ email: string }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("You must be signed in.");

    const result: { email: string } | { error: string } = await ctx.runMutation(internal.users.consumeEmailCode, {
      userId,
      codeHash: await hashCode(code.trim()),
    });
    // Errors are returned rather than thrown so the attempt count is saved.
    if ("error" in result) throw new ConvexError(result.error);
    return result;
  },
});

export const isEmailTaken = internalQuery({
  args: { userId: v.id("users"), email: v.string() },
  handler: async (ctx, { userId, email }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", PROVIDER).eq("providerAccountId", email),
      )
      .first();
    if (account !== null && account.userId !== userId) return true;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    return user !== null && user._id !== userId;
  },
});

export const saveEmailCode = internalMutation({
  args: { userId: v.id("users"), email: v.string(), codeHash: v.string() },
  handler: async (ctx, { userId, email, codeHash }) => {
    const existing = await ctx.db
      .query("emailCodes")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    if (existing.some((c) => Date.now() - c._creationTime < CODE_RESEND_COOLDOWN_MS)) {
      throw new ConvexError("Please wait a minute before requesting another code.");
    }
    for (const c of existing) await ctx.db.delete(c._id);

    await ctx.db.insert("emailCodes", {
      userId,
      email,
      codeHash,
      expiresAt: Date.now() + CODE_TTL_MINUTES * 60 * 1000,
      attempts: 0,
    });
  },
});

export const consumeEmailCode = internalMutation({
  args: { userId: v.id("users"), codeHash: v.string() },
  handler: async (ctx, { userId, codeHash }): Promise<{ email: string } | { error: string }> => {
    const pending = await ctx.db
      .query("emailCodes")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();
    if (pending === null || pending.expiresAt < Date.now()) {
      if (pending) await ctx.db.delete(pending._id);
      return { error: "This code has expired. Request a new one." };
    }

    if (pending.codeHash !== codeHash) {
      const attempts = pending.attempts + 1;
      if (attempts >= MAX_CODE_ATTEMPTS) {
        await ctx.db.delete(pending._id);
        return { error: "Too many incorrect attempts. Request a new code." };
      }
      await ctx.db.patch(pending._id, { attempts });
      return { error: "Incorrect code." };
    }

    await ctx.db.delete(pending._id);
    const { email } = pending;

    // The password account is keyed by email, so it changes along with the user's email.
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", PROVIDER))
      .unique();

    if (account !== null && account.providerAccountId !== email) {
      const taken = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", PROVIDER).eq("providerAccountId", email),
        )
        .first();
      if (taken !== null) return { error: "That email is already in use." };
    }

    if (account !== null) {
      await ctx.db.patch(account._id, { providerAccountId: email, emailVerified: email });
    }
    await ctx.db.patch(userId, { email, emailVerificationTime: Date.now() });
    return { email };
  },
});

export const updatePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { currentPassword, newPassword }) => {
    if (newPassword.length < 8) {
      throw new ConvexError("New password must be at least 8 characters.");
    }

    const { userId, email } = await verifyCurrentPassword(ctx, currentPassword);

    await modifyAccountCredentials(ctx, {
      provider: PROVIDER,
      account: { id: email, secret: newPassword },
    });

    // Sign out other devices, keep this one.
    const sessionId = await getAuthSessionId(ctx);
    await invalidateSessions(ctx, {
      userId,
      except: sessionId ? [sessionId] : [],
    });
  },
});

/** Adds a password to an account that only has OAuth sign-in (Google, GitHub, Discord). */
export const setPassword = action({
  args: { newPassword: v.string() },
  handler: async (ctx, { newPassword }) => {
    if (newPassword.length < 8) {
      throw new ConvexError("Password must be at least 8 characters.");
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("You must be signed in.");

    const check: { email: string } | { error: string } = await ctx.runQuery(
      internal.users.checkCanSetPassword,
      { userId },
    );
    if ("error" in check) throw new ConvexError(check.error);

    // Links to this user because the check confirmed it's the only one with this verified email
    const { account, user } = await createAccount(ctx, {
      provider: PROVIDER,
      account: { id: check.email, secret: newPassword },
      profile: { email: check.email },
      shouldLinkViaEmail: true,
    });
    const result: { ok: true } | { error: string } = await ctx.runMutation(
      internal.users.finishSetPassword,
      { userId, linkedUserId: user._id, accountId: account._id, email: check.email },
    );
    if ("error" in result) throw new ConvexError(result.error);
  },
});

export const checkCanSetPassword = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<{ email: string } | { error: string }> => {
    const user = await ctx.db.get(userId);
    if (!user?.email) return { error: "Your account doesn't have an email address." };
    if (user.emailVerificationTime === undefined) {
      return { error: "Verify your email on the Profile page before setting a password." };
    }
    const existing = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", PROVIDER).eq("providerAccountId", user.email!),
      )
      .first();
    if (existing !== null) {
      return existing.userId === userId
        ? { error: "You already have a password. Use Change Password instead." }
        : { error: "That email is already used by another account." };
    }
    const verifiedUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", user.email))
      .filter((q) => q.neq(q.field("emailVerificationTime"), undefined))
      .take(2);
    if (verifiedUsers.length !== 1) {
      return { error: "Couldn't set a password for this account. Please contact support." };
    }
    return { email: user.email };
  },
});

export const finishSetPassword = internalMutation({
  args: {
    userId: v.id("users"),
    linkedUserId: v.id("users"),
    accountId: v.id("authAccounts"),
    email: v.string(),
  },
  handler: async (
    ctx,
    { userId, linkedUserId, accountId, email },
  ): Promise<{ ok: true } | { error: string }> => {
    if (linkedUserId !== userId) {
      // Shouldn't happen given the check above; undo rather than attach a password to another user.
      // Returned, not thrown, so the delete isn't rolled back.
      await ctx.db.delete(accountId);
      return { error: "Couldn't set a password for this account. Please contact support." };
    }
    // The email is already verified, so password sign-in shouldn't ask for a code
    await ctx.db.patch(accountId, { emailVerified: email });
    return { ok: true };
  },
});

export const signOutOtherSessions = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("You must be signed in.");
    const sessionId = await getAuthSessionId(ctx);
    await invalidateSessions(ctx, { userId, except: sessionId ? [sessionId] : [] });
  },
});

/** Sets or removes (when `phone` is null) the user's phone number. */
export const updatePhone = action({
  args: { phone: v.union(v.string(), v.null()), currentPassword: v.string() },
  handler: async (ctx, { phone, currentPassword }) => {
    let normalized: string | null = null;
    if (phone !== null) {
      // Numbers without a "+" country code are treated as US
      const parsed = parsePhoneNumberFromString(phone, "US");
      if (!parsed?.isValid()) {
        throw new ConvexError("Enter a valid phone number.");
      }
      normalized = parsed.number; // E.164, e.g. +15551234567
    }

    const { userId } = await verifyCurrentPassword(ctx, currentPassword);
    await ctx.runMutation(internal.users.applyPhoneChange, { userId, phone: normalized });
  },
});

export const applyPhoneChange = internalMutation({
  args: { userId: v.id("users"), phone: v.union(v.string(), v.null()) },
  handler: async (ctx, { userId, phone }) => {
    if (phone !== null) {
      const taken = await ctx.db
        .query("users")
        .withIndex("phone", (q) => q.eq("phone", phone))
        .first();
      if (taken !== null && taken._id !== userId) {
        throw new ConvexError("That phone number is already in use.");
      }
    }

    // A new number hasn't been verified yet, so clear any previous verification.
    await ctx.db.patch(userId, {
      phone: phone ?? undefined,
      phoneVerificationTime: undefined,
    });
  },
});
