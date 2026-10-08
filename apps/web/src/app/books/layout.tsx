import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

// page.tsx is a client component, so its metadata lives here
export const metadata = pageMetadata({
  title: "Warhammer 40k Books",
  description:
    "Browse every Warhammer 40,000 book from Black Library: novels, novellas, short stories, anthologies, and audio dramas. Search and filter by author, series, faction, era, and format.",
  path: "/books",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
