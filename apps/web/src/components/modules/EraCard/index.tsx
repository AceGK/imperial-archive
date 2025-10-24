import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import type { Era40k } from "@/types/sanity";

type EraCardProps = {
  title: string;
  slug: string;
  period?: string;
  description?: string;
  image?: any;
  href?: string; // optional override
  compact?: boolean; // hide description in tight grids
  className?: string;
};

export default function EraCard({
  title,
  slug,
  period,
  description,
  image,
  href,
  compact,
  className,
}: EraCardProps) {
  const link = href ?? `/eras/${slug}`;

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
            alt={title}
            fill
            // sizes="(max-width: 768px) 60vw, 320px"
            style={{ objectFit: "cover" }}
            placeholder={image.lqip ? "blur" : "empty"}
            blurDataURL={image.lqip || undefined}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span className={styles.placeholderTitle}>{title}</span>
            {period && (
              <span className={styles.placeholderPeriod}>{period}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>
        {period && <div className={styles.period}>{period}</div>}
        {!compact && description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>
    </Link>
  );
}
