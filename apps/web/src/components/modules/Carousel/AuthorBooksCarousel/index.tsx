// components/modules/Carousel/AuthorBooksCarousel/index.tsx
import { client } from "@/lib/sanity/sanity.client";
import { booksByAuthorSlug40kQuery } from "@/lib/sanity/queries";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import type { Book40k } from "@/types/sanity";

interface AuthorBooksCarouselProps {
  authorSlug: string;
  authorName: string;
  currentBookId: string;
}

export default async function AuthorBooksCarousel({
  authorSlug,
  authorName,
  currentBookId,
}: AuthorBooksCarouselProps) {
  const books: Book40k[] = await client.fetch(booksByAuthorSlug40kQuery, {
    authorSlug,
  });

  // Filter out the current book
  const filteredBooks = books.filter((b) => b._id !== currentBookId);

  // Don't render if there are no other books
  if (filteredBooks.length === 0) {
    return null;
  }

  return (
    <BooksCarousel
      title={`More by ${authorName}`}
      books={filteredBooks}
      compact
      viewAllLink={`/authors/${authorSlug}`}
      viewAllLabel={`View All by ${authorName}`}
    />
  );
}