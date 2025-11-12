import Link from "next/link";
import styles from "./styles.module.scss";

interface Author {
  name?: string;
  slug?: string;
}

interface AuthorsProps {
  authors?: Author[];
  inline?: boolean;
}

export default function Authors({ authors, inline = false }: AuthorsProps) {
  if (!authors || authors.length === 0) {
    return inline ? <span>Unknown</span> : null;
  }

  if (inline) {
    // Inline rendering for use within text (e.g., "by Author Name")
    if (authors.length === 1) {
      const author = authors[0];
      return author?.slug ? (
        <Link href={`/authors/${encodeURIComponent(author.slug)}`}>
          {author.name}
        </Link>
      ) : (
        <span>{author?.name ?? "Unknown"}</span>
      );
    }

    return (
      <>
        {authors.map((author, i) => {
          const node = author?.slug ? (
            <Link
              key={author.slug}
              href={`/authors/${encodeURIComponent(author.slug)}`}
            >
              {author?.name ?? "Unknown"}
            </Link>
          ) : (
            <span key={author?.name ?? i}>{author?.name ?? "Unknown"}</span>
          );
          return (
            <span key={(author?.slug ?? author?.name ?? "") + i}>
              {node}
              {i < authors.length - 1 ? ", " : ""}
            </span>
          );
        })}
      </>
    );
  }

  // Block rendering for book details page
  return (
    <div className={styles.authors}>
      <div className={styles.label}>
        {authors.length > 1 ? "Authors" : "Author"}
      </div>
      <div className={styles.list}>
        {authors.length === 1 ? (
          authors[0]?.slug ? (
            <Link
              href={`/authors/${encodeURIComponent(authors[0].slug)}`}
            >
              {authors[0].name}
            </Link>
          ) : (
            <span>{authors[0]?.name ?? "Unknown"}</span>
          )
        ) : (
          <>
            {authors.map((author, i) => {
              const node = author?.slug ? (
                <Link
                  key={author.slug}
                  href={`/authors/${encodeURIComponent(author.slug)}`}
                >
                  {author?.name ?? "Unknown"}
                </Link>
              ) : (
                <span key={author?.name ?? i}>
                  {author?.name ?? "Unknown"}
                </span>
              );
              return (
                <span key={(author?.slug ?? author?.name ?? "") + i}>
                  {node}
                  {i < authors.length - 1 ? ", " : ""}
                </span>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}