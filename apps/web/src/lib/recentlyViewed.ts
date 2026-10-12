// lib/recentlyViewed.ts
// Books the reader has opened, newest first, kept in this browser only
// (localStorage). Each entry is a small snapshot with what a BookCard needs,
// so the list renders without fetching anything.
import type { BookCardData } from "@/components/modules/Cards/BookCard";

const KEY = "ia-recently-viewed";
const MAX = 20;

export type RecentBook = Required<Pick<BookCardData, "_id" | "title" | "slug">> &
  Pick<BookCardData, "authors" | "format" | "publication_date" | "series"> & {
    image?: { url: string | null; alt?: string | null } | null;
  };

export function readRecentlyViewed(): RecentBook[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((b) => b?._id && b?.slug && b?.title) : [];
  } catch {
    return [];
  }
}

/** Moves the book to the front of the list (adding it if new) */
export function recordRecentlyViewed(book: RecentBook) {
  try {
    const list = [book, ...readRecentlyViewed().filter((b) => b._id !== book._id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode, full): recently viewed just stays empty
  }
}
