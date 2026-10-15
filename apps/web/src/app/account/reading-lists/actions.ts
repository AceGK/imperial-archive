"use server";

import { client } from "@/lib/sanity/sanity.client";
import { favoriteItems40kQuery } from "@/lib/sanity/queries";
import type { FavoriteItem } from "@/components/modules/Account/Favorites";

export type ListBook = Extract<FavoriteItem, { _type: "book40k" }>;

/** Card data for books in reading lists. Deleted books are simply missing. */
export async function getListBooks(ids: string[]): Promise<ListBook[]> {
  const safeIds = [...new Set(ids)]
    .filter((id) => typeof id === "string" && id.length <= 200 && !id.startsWith("drafts."))
    .slice(0, 1000);
  if (safeIds.length === 0) return [];
  const docs = await client.fetch<FavoriteItem[]>(favoriteItems40kQuery, { ids: safeIds });
  return docs.filter((d): d is ListBook => d._type === "book40k");
}
