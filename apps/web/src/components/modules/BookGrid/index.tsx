import BookCard, { type BookCardData } from "@/components/modules/BookCard";
import styles from "./styles.module.scss";

type Props = {
  books: BookCardData[];
  noResultsText?: string;
  className?: string;
};

export default function BookGrid({ books, noResultsText = "No books found.", className }: Props) {
  return (
    <div className={className}>
      {books.length === 0 ? (
        <p>{noResultsText}</p>
      ) : (
        <div className={styles.grid}>
          {books.map((b) => (
            <BookCard key={b._id} book={b} href={`/books/${b.slug}`} compact />
          ))}
        </div>
      )}
    </div>
  );
}
