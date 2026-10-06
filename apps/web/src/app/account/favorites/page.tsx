import type { Metadata } from "next";
import Favorites from "@/components/modules/Account/Favorites";

export const metadata: Metadata = { title: "Favorites | Account" };

export default function FavoritesPage() {
  return <Favorites />;
}
