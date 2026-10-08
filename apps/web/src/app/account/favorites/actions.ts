"use server";

import { client } from "@/lib/sanity/sanity.client";
import { favoriteItems40kQuery } from "@/lib/sanity/queries";
import type { FavoriteItem } from "@/components/modules/Account/Favorites";

/** Card data for favorited Sanity documents. Deleted documents are simply missing. */
export async function getFavoriteItems(ids: string[]): Promise<FavoriteItem[]> {
  const safeIds = ids
    .filter((id) => typeof id === "string" && id.length <= 200 && !id.startsWith("drafts."))
    .slice(0, 500);
  if (safeIds.length === 0) return [];
  return client.fetch<FavoriteItem[]>(favoriteItems40kQuery, { ids: safeIds });
}
