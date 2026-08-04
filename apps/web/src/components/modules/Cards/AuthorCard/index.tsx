import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import { urlFor } from "@/lib/sanity/sanity.image";

type AuthorCardImage = {
  asset?: { _ref?: string; _id?: string; url?: string } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  hotspot?: { x: number; y: number; height: number; width: number } | null;
  alt?: string | null;
  lqip?: string | null;
};

type AuthorCardProps = {
  name: string;
  slug: string;
  count: number;
  image?: AuthorCardImage | null;
};

function getInitials(fullName: string) {
  if (!fullName) return null;
  const parts = fullName
    .replace(/\./g, " ")
    .replace(/[’']/g, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const initials = parts.map((p) => p.match(/\p{L}/u)?.[0] || "").join("");
  return initials ? initials.toUpperCase() : null;
}

// Helper to check for a usable Sanity image asset (reference or dereferenced)
function hasValidAsset(image?: AuthorCardImage | null): boolean {
  if (!image?.asset) return false;
  const ref = image.asset._ref ?? image.asset._id;
  const url = image.asset.url;
  return Boolean((ref && ref.length > 0) || url);
}

export default function AuthorCard({
  name,
  slug,
  count,
  image,
}: AuthorCardProps) {
  const initials = getInitials(name);

  const src = hasValidAsset(image)
    ? urlFor(image!).width(240).height(240).fit("crop").url()
    : null;

  return (
    <Link href={`/authors/${slug}`} className={styles.card}>
      <div className={styles.image} aria-hidden="true" title={name}>
        {src ? (
          <Image
            src={src}
            alt={image?.alt || name}
            width={240}
            height={240}
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 33vw, 240px"
            {...(image?.lqip && {
              placeholder: "blur" as const,
              blurDataURL: image.lqip,
            })}
            unoptimized
          />
        ) : (
          initials
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.name}>{name}</div>
        <span className={styles.count}>
          {count} Work{count === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
