import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * One-time: lowercase existing emails so they match the normalized sign-in flow.
 * Dry run by default; reports what would change and any conflicts.
 *   npx convex run migrations:lowercaseEmails
 *   npx convex run migrations:lowercaseEmails '{"dryRun": false}'
 */
export const lowercaseEmails = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = true }) => {
    const accounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("provider"), "password"))
      .collect();

    const lowerIds = new Map<string, number>();
    for (const account of accounts) {
      const lower = account.providerAccountId.toLowerCase();
      lowerIds.set(lower, (lowerIds.get(lower) ?? 0) + 1);
    }

    const changed: string[] = [];
    const conflicts: string[] = [];

    for (const account of accounts) {
      const lower = account.providerAccountId.toLowerCase();
      if (lower === account.providerAccountId) continue;

      // Two accounts that only differ by case can't both be lowercased; resolve by hand.
      if ((lowerIds.get(lower) ?? 0) > 1) {
        conflicts.push(account.providerAccountId);
        continue;
      }

      changed.push(`${account.providerAccountId} -> ${lower}`);
      if (!dryRun) {
        await ctx.db.patch(account._id, {
          providerAccountId: lower,
          ...(account.emailVerified ? { emailVerified: lower } : {}),
        });
        const user = await ctx.db.get(account.userId);
        if (user?.email) await ctx.db.patch(user._id, { email: user.email.toLowerCase() });
      }
    }

    return { dryRun, checked: accounts.length, changed, conflicts };
  },
});
