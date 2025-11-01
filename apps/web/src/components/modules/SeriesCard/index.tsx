// /components/cards/SeriesCard/index.tsx
import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import { urlFor } from "@/lib/sanity/sanity.image";
import type { SanityImageField } from "@/types/sanity";

type Props = {
  title: string;
  slug: string;
  description?: string | null;
  image?: SanityImageField | null;   // <- accept the full image field
  href?: string;
  compact?: boolean;
  className?: string;
  countLabel?: string;
};

export default function SeriesCard({
  title, slug, description, image, href, compact, className, countLabel,
}: Props) {
  const link = href ?? `/series/${slug}`;

  // For a 16:9 card, request both width & height so crop/hotspot apply
  const cardW = 640;         // tweak per your grid
  const cardH = Math.round(cardW * 9 / 16);

const src = image?.asset
  ? urlFor(image).width(cardW).height(cardH).fit("crop").auto("format").url()
  : null;

  const blur = image?.asset?.metadata?.lqip || undefined;
  const alt = image?.alt || title;

  return (
    <Link href={link} className={`${styles.card} ${className ?? ""}`}>
      <div className={styles.image} title={title} aria-hidden={src ? "false" : "true"}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 60vw, 320px"
            placeholder={blur ? "blur" : "empty"}
            blurDataURL={blur}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span className={styles.placeholderTitle}>{title}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={title}>{title}</h3>
        {countLabel && <div className={styles.meta}>{countLabel}</div>}
        {!compact && description && <p className={styles.description}>{description}</p>}
      </div>
    </Link>
  );
}
