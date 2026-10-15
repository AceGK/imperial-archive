import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/sanity.image";
import FavoriteButton from "@/components/modules/FavoriteButton";
import type { SeriesHit } from "@/types/algolia";
import styles from "@/components/modules/Cards/ListRow/styles.module.scss";

/** A series in the catalog's list view: [banner] [title, authors, description] ..... [Favorite] */
export default function SeriesRow({ series }: { series: SeriesHit }) {
  const link = `/series/${series.slug}`;
  const count = series.bookCount ?? 0;
  const image = series.image as Parameters<typeof urlFor>[0] | undefined;
  const hasImage = Boolean(series.image?.asset?._ref);
  const authors = series["authors.name"] ?? [];
  const authorSlugs = series["authors.slug"] ?? [];
  const eras = series["era.name"] ?? [];
  const eraSlugs = series["era.slug"] ?? [];

  return (
    <article className={styles.row}>
      <Link href={link} className={`${styles.thumb} ${styles.thumbSeries}`} aria-hidden="true" tabIndex={-1}>
        {hasImage && image ? (
          <Image src={urlFor(image).width(256).height(144).fit("crop").auto("format").url()} alt="" fill sizes="128px" unoptimized />
        ) : (
          <span className={styles.placeholder}>{series.title}</span>
        )}
      </Link>

      <div className={styles.details}>
        <Link href={link} className={styles.title}>
          {series.title}
        </Link>
        <div className={styles.byline}>
          {count} {count === 1 ? "publication" : "publications"}
          {authors.length > 0 && (
            <>
              {" · by "}
              {authors.slice(0, 2).map((name, i) => (
                <span key={authorSlugs[i] ?? name}>
                  {i > 0 && ", "}
                  <Link href={`/authors/${authorSlugs[i]}`}>{name}</Link>
                </span>
              ))}
              {authors.length > 2 && ` +${authors.length - 2} more`}
            </>
          )}
        </div>
        {series.subtitle && <p className={styles.excerpt}>{series.subtitle}</p>}
        {eras.length > 0 && (
          <div className={styles.facts}>
            {eras.map((name, i) => (
              <Link key={eraSlugs[i] ?? name} href={`/eras/${eraSlugs[i]}`} className={`${styles.chip} ${styles.chipMuted}`}>
                {name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <FavoriteButton kind="series" itemId={series.objectID} />
      </div>
    </article>
  );
}
