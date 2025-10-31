// /components/cards/SeriesCard/index.tsx
import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";

type Props = {
  title: string;
  slug: string;
  description?: string | null;
  image?: { url?: string | null; lqip?: string | null; alt?: string | null } | null; // projected shape
  href?: string;          // optional override
  compact?: boolean;      // hide description in tight grids
  className?: string;
  countLabel?: string;    // optional small stat like "9 books"
};

export default function SeriesCard({
  title,
  slug,
  description,
  image,
  href,
  compact,
  className,
  countLabel,
}: Props) {
  const link = href ?? `/series/${slug}`;

  return (
    <Link href={link} className={`${styles.card} ${className ?? ""}`}>
      <div
        className={styles.image}
        title={title}
        aria-hidden={!!image?.url ? "false" : "true"}
      >
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || title}
            fill
            style={{ objectFit: "cover" }}
            placeholder={image.lqip ? "blur" : "empty"}
            blurDataURL={image.lqip || undefined}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span className={styles.placeholderTitle}>{title}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>
        {countLabel && <div className={styles.meta}>{countLabel}</div>}
        {!compact && description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>
    </Link>
  );
}
