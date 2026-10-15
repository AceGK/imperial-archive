import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { MAX_BOOKS_PER_LIST, MAX_LISTS, MAX_NAME_LENGTH } from "./readingListLimits";

async function requireUser(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Sign in to use reading lists.");
  return userId;
}

function cleanName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) throw new ConvexError("Give the list a name.");
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ConvexError(`List names can be up to ${MAX_NAME_LENGTH} characters.`);
  }
  return trimmed;
}

// Sanity _ids of published documents; never store drafts
function checkBookId(bookId: string) {
  if (!bookId || bookId.length > 200 || bookId.startsWith("drafts.")) {
    throw new ConvexError("Invalid book.");
  }
}

async function ownList(ctx: MutationCtx, userId: Id<"users">, listId: Id<"readingLists">) {
  const list = await ctx.db.get(listId);
  if (!list || list.userId !== userId) throw new ConvexError("List not found.");
  return list;
}

async function itemsOf(ctx: MutationCtx, listId: Id<"readingLists">) {
  return ctx.db
    .query("readingListItems")
    .withIndex("by_list_position", (q) => q.eq("listId", listId))
    .collect();
}

async function addBook(ctx: MutationCtx, userId: Id<"users">, listId: Id<"readingLists">, bookId: string) {
  const items = await itemsOf(ctx, listId);
  if (items.some((i) => i.bookId === bookId)) return;
  if (items.length >= MAX_BOOKS_PER_LIST) {
    throw new ConvexError(`A list can hold up to ${MAX_BOOKS_PER_LIST} books.`);
  }
  const last = items[items.length - 1];
  await ctx.db.insert("readingListItems", {
    listId,
    userId,
    bookId,
    position: last ? last.position + 1 : 0,
  });
}

/**
 * The signed-in user's lists, oldest first, each with its books in order.
 * Small enough (see readingListLimits) to send whole, so every card and dialog
 * can work out which lists hold a book from this one subscription.
 */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const lists = await ctx.db
      .query("readingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const items = await ctx.db
      .query("readingListItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return lists
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((list) => ({
        _id: list._id,
        name: list.name,
        updatedAt: list.updatedAt,
        bookIds: items
          .filter((i) => i.listId === list._id)
          .sort((a, b) => a.position - b.position)
          .map((i) => i.bookId),
      }));
  },
});

/**
 * How many of the signed-in user's lists hold this book (0 when signed out).
 * For a book page's hint: reads only that book's entries, not every list.
 */
export const countForBook = query({
  args: { bookId: v.string() },
  handler: async (ctx, { bookId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return 0;
    const entries = await ctx.db
      .query("readingListItems")
      .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
      .take(MAX_LISTS);
    return entries.length;
  },
});

/** Creates a list, optionally with a first book. Returns the new list's id. */
export const create = mutation({
  args: { name: v.string(), bookId: v.optional(v.string()) },
  handler: async (ctx, { name, bookId }) => {
    const userId = await requireUser(ctx);
    const clean = cleanName(name);
    if (bookId !== undefined) checkBookId(bookId);

    const lists = await ctx.db
      .query("readingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (lists.length >= MAX_LISTS) {
      throw new ConvexError(`You can have up to ${MAX_LISTS} lists.`);
    }
    if (lists.some((l) => l.name.toLowerCase() === clean.toLowerCase())) {
      throw new ConvexError("You already have a list with that name.");
    }

    const listId = await ctx.db.insert("readingLists", { userId, name: clean, updatedAt: Date.now() });
    if (bookId !== undefined) await addBook(ctx, userId, listId, bookId);
    return listId;
  },
});

export const rename = mutation({
  args: { listId: v.id("readingLists"), name: v.string() },
  handler: async (ctx, { listId, name }) => {
    const userId = await requireUser(ctx);
    await ownList(ctx, userId, listId);
    const clean = cleanName(name);
    const others = await ctx.db
      .query("readingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (others.some((l) => l._id !== listId && l.name.toLowerCase() === clean.toLowerCase())) {
      throw new ConvexError("You already have a list with that name.");
    }
    await ctx.db.patch(listId, { name: clean, updatedAt: Date.now() });
  },
});

/** Deletes a list and everything in it. */
export const remove = mutation({
  args: { listId: v.id("readingLists") },
  handler: async (ctx, { listId }) => {
    const userId = await requireUser(ctx);
    await ownList(ctx, userId, listId);
    for (const item of await itemsOf(ctx, listId)) await ctx.db.delete(item._id);
    await ctx.db.delete(listId);
  },
});

/** Adds the book to the end of the list, or removes it if it's already there. Returns whether it's in the list. */
export const toggleBook = mutation({
  args: { listId: v.id("readingLists"), bookId: v.string() },
  handler: async (ctx, { listId, bookId }) => {
    const userId = await requireUser(ctx);
    checkBookId(bookId);
    await ownList(ctx, userId, listId);
    const existing = await ctx.db
      .query("readingListItems")
      .withIndex("by_list_book", (q) => q.eq("listId", listId).eq("bookId", bookId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    else await addBook(ctx, userId, listId, bookId);
    await ctx.db.patch(listId, { updatedAt: Date.now() });
    return !existing;
  },
});

/** Puts the list's books in the given order; `bookIds` must be exactly the books in the list. */
export const reorder = mutation({
  args: { listId: v.id("readingLists"), bookIds: v.array(v.string()) },
  handler: async (ctx, { listId, bookIds }) => {
    const userId = await requireUser(ctx);
    await ownList(ctx, userId, listId);
    const items = await itemsOf(ctx, listId);
    const byBook = new Map(items.map((i) => [i.bookId, i]));
    if (bookIds.length !== items.length || new Set(bookIds).size !== bookIds.length || !bookIds.every((id) => byBook.has(id))) {
      throw new ConvexError("The list changed. Refresh and try again.");
    }
    for (const [position, bookId] of bookIds.entries()) {
      const item = byBook.get(bookId)!;
      if (item.position !== position) await ctx.db.patch(item._id, { position });
    }
    await ctx.db.patch(listId, { updatedAt: Date.now() });
  },
});
