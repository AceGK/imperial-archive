// app/books/page.tsx
import type { Metadata } from "next";
import { catalogPageParam, pageMetadata } from "@/lib/seo";
import BooksIndex from "./BooksIndex";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// the catalog is a client component, so the metadata lives in this wrapper;
// later pages (?page=2, linked from "Load more") get their own title and canonical
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pageMetadata({
    title: "Warhammer 40k Books",
    description:
      "Browse every Warhammer 40,000 book from Black Library: novels, novellas, short stories, anthologies, and audio dramas. Search and filter by author, series, faction, era, and format.",
    path: "/books",
    page: catalogPageParam(await searchParams),
  });
}

export default function Page() {
  return <BooksIndex />;
}
