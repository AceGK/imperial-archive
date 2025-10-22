import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";

type AuthorCardProps = {
  name: string;
  slug: string;
  count: number;
  imageUrl?: string;
};

function getInitials(fullName: string) {
  if (!fullName) return "?";
  const parts = fullName
    .replace(/\./g, " ")
    .replace(/[\u2019']/g, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const initials = parts.map((p) => (p.match(/\p{L}/u)?.[0] || "")).join("");
  return initials ? initials.toUpperCase() : "?";
}

export default function AuthorCard({ name, slug, count, imageUrl }: AuthorCardProps) {
  const initials = getInitials(name);

  return (
    <Link href={`/authors/${slug}`} className={styles.card}>
      <div className={styles.image} aria-hidden="true" title={name}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={240}
            height={240}
            style={{ objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </div>

      <div className={styles.name}>{name}</div>
      <span className={styles.count}>
        {count} Work{count === 1 ? "" : "s"}
      </span>
    </Link>
  );
}
