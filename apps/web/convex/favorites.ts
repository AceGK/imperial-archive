import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const favoriteKind = v.union(
  v.literal("book"),
  v.literal("series"),
  v.literal("author"),
  v.literal("faction"),
  v.literal("era"),
);

/** Whether the signed-in user has favorited this item (false when signed out). */
export const isFavorite = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();
    return existing !== null;
  },
});

/** Adds or removes a favorite. Returns the new state. */
export const toggle = mutation({
  args: { kind: favoriteKind, itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Sign in to save favorites.");
    // Sanity _ids of published documents; never store drafts
    if (!itemId || itemId.length > 200 || itemId.startsWith("drafts.")) {
      throw new ConvexError("Invalid item.");
    }

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("favorites", { userId, kind, itemId });
    return true;
  },
});

/** The signed-in user's favorites, newest first (empty when signed out). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_kind", (q) => q.eq("userId", userId))
      .collect();
    return favorites
      .sort((a, b) => b._creationTime - a._creationTime)
      .map(({ kind, itemId }) => ({ kind, itemId }));
  },
});
