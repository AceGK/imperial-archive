import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";

type AuthorCardProps = {
  name: string;
  slug: string;
  count: number;
  image?: {
    url?: string;
    lqip?: string;
    aspect?: number;
  };
};

function getInitials(fullName: string) {
  if (!fullName) return null;
  const parts = fullName
    .replace(/\./g, " ")
    .replace(/[\u2019']/g, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const initials = parts.map((p) => p.match(/\p{L}/u)?.[0] || "").join("");
  return initials ? initials.toUpperCase() : null;
}

export default function AuthorCard({
  name,
  slug,
  count,
  image,
}: AuthorCardProps) {
  const initials = getInitials(name);

  return (
    <Link href={`/authors/${slug}`} className={styles.card}>
      <div className={styles.image} aria-hidden="true" title={name}>
        {image?.url ? (
          <Image
            src={image.url}
            alt={name}
            width={240}
            height={240}
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 33vw, 240px"
            {...(image.lqip && {
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