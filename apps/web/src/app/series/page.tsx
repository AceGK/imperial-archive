// app/series/page.tsx
import type { Metadata } from "next";
import { catalogPageParam, pageMetadata } from "@/lib/seo";
import SeriesIndex from "./SeriesIndex";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// the catalog is a client component, so the metadata lives in this wrapper;
// later pages (?page=2, linked from "Load more") get their own title and canonical
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pageMetadata({
    title: "Warhammer 40k Series & Reading Orders",
    description:
      "Every Warhammer 40,000 book series from Black Library, including the Horus Heresy, with reading orders so you know where to start and what comes next.",
    path: "/series",
    page: catalogPageParam(await searchParams),
  });
}

export default function Page() {
  return <SeriesIndex />;
}
