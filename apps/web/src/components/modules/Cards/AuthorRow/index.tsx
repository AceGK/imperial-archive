import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/sanity.image";
import FavoriteButton from "@/components/modules/FavoriteButton";
import type { AuthorHit } from "@/types/algolia";
import styles from "@/components/modules/Cards/ListRow/styles.module.scss";

// "Dan Abnett" -> "DA", shown when an author has no photo
function initials(name: string) {
  return name
    .replace(/[.’']/g, " ")
    .split(/[\s-]+/)
    .map((part) => part.match(/\p{L}/u)?.[0] ?? "")
    .join("")
    .toUpperCase();
}

/** An author in the catalog's list view: [photo] [name, bio, series] ..... [Favorite] */
export default function AuthorRow({ author }: { author: AuthorHit }) {
  const link = `/authors/${author.slug}`;
  const count = author.bookCount ?? 0;
  const image = author.image as Parameters<typeof urlFor>[0] | undefined;
  const hasImage = Boolean((author.image as { asset?: { _ref?: string } } | undefined)?.asset?._ref);
  const series = author["series.title"] ?? [];
  const seriesSlugs = author["series.slug"] ?? [];

  return (
    <article className={styles.row}>
      <Link href={link} className={`${styles.thumb} ${styles.thumbAuthor}`} aria-hidden="true" tabIndex={-1}>
        {hasImage && image ? (
          <Image src={urlFor(image).width(128).height(128).fit("crop").url()} alt="" fill sizes="64px" unoptimized />
        ) : (
          initials(author.name)
        )}
      </Link>

      <div className={styles.details}>
        <Link href={link} className={styles.title}>
          {author.name}
        </Link>
        <div className={styles.byline}>
          {count} {count === 1 ? "publication" : "publications"}
        </div>
        {author.bio && <p className={styles.excerpt}>{author.bio}</p>}
        {series.length > 0 && (
          <div className={styles.facts}>
            {series.slice(0, 3).map((title, i) => (
              <Link
                key={seriesSlugs[i] ?? title}
                href={`/series/${seriesSlugs[i]}`}
                className={`${styles.chip} ${styles.chipMuted}`}
              >
                {title}
              </Link>
            ))}
            {series.length > 3 && <span>+{series.length - 3} more series</span>}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <FavoriteButton kind="author" itemId={author.objectID} />
      </div>
    </article>
  );
}
