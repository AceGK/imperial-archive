// app/authors/page.tsx
import type { Metadata } from "next";
import { catalogPageParam, pageMetadata } from "@/lib/seo";
import AuthorsIndex from "./AuthorsIndex";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// the catalog is a client component, so the metadata lives in this wrapper;
// later pages (?page=2, linked from "Load more") get their own title and canonical
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pageMetadata({
    title: "Black Library Authors",
    description:
      "Browse Warhammer 40,000 authors from Black Library, from Dan Abnett and Aaron Dembski-Bowden to Graham McNeill, and see every 40k book each has written.",
    path: "/authors",
    page: catalogPageParam(await searchParams),
  });
}

export default function Page() {
  return <AuthorsIndex />;
}
