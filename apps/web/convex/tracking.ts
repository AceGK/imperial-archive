import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";

/** "want" is Want to read; no status at all is Unread */
export const readingStatus = v.union(v.literal("want"), v.literal("reading"), v.literal("read"));

const emptyState = { status: null, owned: false } as const;

/** How the signed-in user has tracked this book (nothing tracked when signed out). */
export const get = query({
  args: { bookId: v.string() },
  handler: async (ctx, { bookId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return emptyState;
    const row = await ctx.db
      .query("tracked")
      .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
      .first();
    return row ? { status: row.status ?? null, owned: row.owned } : emptyState;
  },
});

/** Writes one book's tracking, deleting the row once nothing is tracked. */
async function save(
  ctx: MutationCtx,
  bookId: string,
  change: { status?: "want" | "reading" | "read" | null; owned?: boolean },
) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Sign in to track books.");
  // Sanity _ids of published documents; never store drafts
  if (!bookId || bookId.length > 200 || bookId.startsWith("drafts.")) {
    throw new ConvexError("Invalid book.");
  }

  const row = await ctx.db
    .query("tracked")
    .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
    .first();

  const status = change.status !== undefined ? change.status : (row?.status ?? null);
  const owned = change.owned ?? row?.owned ?? false;

  if (status === null && !owned) {
    if (row) await ctx.db.delete(row._id);
  } else if (row) {
    await ctx.db.patch(row._id, { status: status ?? undefined, owned, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("tracked", { userId, bookId, status: status ?? undefined, owned, updatedAt: Date.now() });
  }
  return { status, owned };
}

/** Sets Want to read, Reading, or Read, or clears it with null. Returns the book's new state. */
export const setStatus = mutation({
  args: { bookId: v.string(), status: v.union(readingStatus, v.null()) },
  handler: (ctx, { bookId, status }) => save(ctx, bookId, { status }),
});

/** Marks the book as owned or not. Returns the book's new state. */
export const setOwned = mutation({
  args: { bookId: v.string(), owned: v.boolean() },
  handler: (ctx, { bookId, owned }) => save(ctx, bookId, { owned }),
});

/** Everything the signed-in user tracks, most recently changed first (empty when signed out). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("tracked")
      .withIndex("by_user_book", (q) => q.eq("userId", userId))
      .collect();
    return rows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(({ bookId, status, owned }) => ({ bookId, status: status ?? null, owned }));
  },
});
