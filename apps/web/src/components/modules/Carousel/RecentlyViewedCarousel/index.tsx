// components/modules/Carousel/RecentlyViewedCarousel/index.tsx
"use client";

import { useEffect, useState } from "react";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import { readRecentlyViewed, recordRecentlyViewed, type RecentBook } from "@/lib/recentlyViewed";
import type { Book40k } from "@/types/sanity";

/**
 * Records the current book as viewed, and shows the reader's other recently
 * viewed books. Renders nothing until there's at least one other book, and
 * only after mount, since the list lives in this browser's storage.
 */
export default function RecentlyViewedCarousel({ book }: { book: RecentBook }) {
  const [others, setOthers] = useState<RecentBook[]>([]);

  useEffect(() => {
    setOthers(readRecentlyViewed().filter((b) => b._id !== book._id));
    recordRecentlyViewed(book);
    // the book's identity is all that matters here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book._id]);

  if (others.length === 0) return null;

  return (
    <section className="container row">
      <BooksCarousel title="Recently Viewed" books={others as unknown as Book40k[]} compact />
    </section>
  );
}
