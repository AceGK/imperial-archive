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

  // A user's own named lists of books, in an order they choose.
  readingLists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // One book in a reading list. `position` orders the list (lowest first);
  // `bookId` is the Sanity document _id. `userId` is copied from the list so a
  // user's lists can be read in one query.
  readingListItems: defineTable({
    listId: v.id("readingLists"),
    userId: v.id("users"),
    bookId: v.string(),
    position: v.number(),
  })
    .index("by_list_position", ["listId", "position"])
    .index("by_list_book", ["listId", "bookId"])
    .index("by_user", ["userId"])
    .index("by_user_book", ["userId", "bookId"]),

  // Submissions from the site's report and feedback forms, kept as tickets.
  // Fields beyond the common ones depend on `type`.
  reports: defineTable({
    type: v.union(v.literal("siteIssue"), v.literal("missingBook"), v.literal("feedback")),
    status: v.union(v.literal("new"), v.literal("inProgress"), v.literal("done"), v.literal("declined")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    // set when the sender was signed in
    userId: v.optional(v.id("users")),
    message: v.optional(v.string()),
    // siteIssue
    pageUrl: v.optional(v.string()),
    os: v.optional(v.string()),
    browser: v.optional(v.string()),
    // missingBook
    bookTitle: v.optional(v.string()),
    bookAuthor: v.optional(v.string()),
    series: v.optional(v.string()),
    format: v.optional(v.string()),
    // "2024", "2024-03" or "2024-03-15"
    releaseDate: v.optional(v.string()),
    // from before release dates replaced years; only early test reports have it
    releaseYear: v.optional(v.string()),
    isbn: v.optional(v.string()),
    link: v.optional(v.string()),
    // salted hash of the sender's IP, only for rate limiting
    ipHash: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_ip", ["ipHash"])
    .index("by_user", ["userId"]),
});

export default schema;
