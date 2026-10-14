import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Pending codes for verifying the current email or confirming a new one from the account page.
  emailCodes: defineTable({
    userId: v.id("users"),
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
  }).index("userId", ["userId"]),

  // A user's favorited catalog items. `itemId` is the Sanity document _id.
  favorites: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("book"),
      v.literal("series"),
      v.literal("author"),
      v.literal("faction"),
      v.literal("era"),
    ),
    itemId: v.string(),
  })
    .index("by_user_kind", ["userId", "kind"])
    .index("by_user_item", ["userId", "itemId"])
    .index("by_item", ["itemId"]),

  // A user's reading log, one row per book. Reading status and ownership are
  // independent (you can own a book you've read); a row with neither is deleted.
  // `bookId` is the Sanity document _id.
  tracked: defineTable({
    userId: v.id("users"),
    bookId: v.string(),
    status: v.optional(v.union(v.literal("want"), v.literal("reading"), v.literal("read"))),
    owned: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user_book", ["userId", "bookId"]),
});

export default schema;
