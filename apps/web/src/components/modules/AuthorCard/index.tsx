import Link from "next/link";
import styles from "./styles.module.scss";

type AuthorCardProps = {
  name: string;
  slug: string;
  count: number;
};

function getInitials(fullName: string) {
  if (!fullName) return "?";

  // Normalize: turn dots into spaces so "C.L." becomes "C L"
  // remove apostrophes, then split on spaces or hyphens
  const parts = fullName
    .replace(/\./g, " ")
    .replace(/[\u2019']/g, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";

  // take the first letter of each part
  const initials = parts
    .map(p => (p.match(/\p{L}/u)?.[0] || "")) // first letter of each word
    .join("");

  return initials ? initials.toUpperCase() : "?";
}
export default function AuthorCard({ name, slug, count }: AuthorCardProps) {
  const initials = getInitials(name);

  return (
    <Link
      href={`/authors/${slug}`}
      className={styles.card}
      aria-label={`${name} — ${count} book${count === 1 ? "" : "s"}`}
    >
      {/* Placeholder image with initials */}
      <div className={styles.image} aria-hidden="true" title={name}>
        {initials}
      </div>

      <div className={styles.name}>{name}</div>
      <span
        className={styles.count}
        title={`${count} book${count === 1 ? "" : "s"}`}
      >
        {count} Work{count === 1 ? "" : "s"}
      </span>
    </Link>
  );
}
