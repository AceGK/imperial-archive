"use server";

import { client } from "@/lib/sanity/sanity.client";
import { favoriteItems40kQuery } from "@/lib/sanity/queries";
import type { FavoriteItem } from "@/components/modules/Account/Favorites";

export type TrackedBook = Extract<FavoriteItem, { _type: "book40k" }>;

/** Card data for tracked books. Deleted books are simply missing. */
export async function getTrackedBooks(ids: string[]): Promise<TrackedBook[]> {
  const safeIds = ids
    .filter((id) => typeof id === "string" && id.length <= 200 && !id.startsWith("drafts."))
    .slice(0, 1000);
  if (safeIds.length === 0) return [];
  const docs = await client.fetch<FavoriteItem[]>(favoriteItems40kQuery, { ids: safeIds });
  return docs.filter((d): d is TrackedBook => d._type === "book40k");
}
