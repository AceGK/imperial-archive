// components/modules/Carousel/SeriesBooksCarousel/index.tsx
import { client } from "@/lib/sanity/sanity.client";
import { booksBySeriesSlug40kQuery } from "@/lib/sanity/queries";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import type { Book40k } from "@/types/sanity";

interface SeriesBooksCarouselProps {
  seriesSlug: string;
  seriesName: string;
  currentBookId: string;
}

export default async function SeriesBooksCarousel({
  seriesSlug,
  seriesName,
  currentBookId,
}: SeriesBooksCarouselProps) {
  const result = await client.fetch(booksBySeriesSlug40kQuery, {
    seriesSlug,
  });

  if (!result || !result.books) {
    return null;
  }

  // Filter out the current book
  const filteredBooks = result.books.filter((b: Book40k) => b._id !== currentBookId);

  // Don't render if there are no other books
  if (filteredBooks.length === 0) {
    return null;
  }

  // Check if "Series" is already in the name (case insensitive)
  const hasSeriesInName = /series/i.test(seriesName);
  const title = hasSeriesInName 
    ? `More from the ${seriesName}`
    : `More from the ${seriesName} Series`;

  return (
    <BooksCarousel
      title={title}
      books={filteredBooks}
      compact
      viewAllLink={`/series/${seriesSlug}`}
      viewAllLabel={`View All in ${seriesName}`}
    />
  );
}