// /components/modules/FactionCard.tsx
import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import { resolveIcon } from "@/components/icons/factions/resolve";
import type { CSSProperties } from "react";

type FactionCardProps = {
  title: string;
  slug: string;          // e.g. "dark-angels"
  iconId?: string;
  image?: string;
  group?: string;
  href?: string;
};

export default function FactionCard({
  title, slug, iconId, image, group, href,
}: FactionCardProps) {
  const link =
    href ?? (slug.startsWith("/")
      ? slug
      : group
      ? `/factions/${group}/${slug}`
      : `/factions/${slug}`);

  const Icon = resolveIcon(iconId);

  // Map this card's local vars → your global palette vars
  const style = {
    // fallbacks ensure readable contrast if a slug color is missing
    ["--faction-primary" as any]: `var(--${slug}-primary, #2c3e94)`,
    ["--faction-secondary" as any]: `var(--${slug}-secondary, #e5e5e5)`,
  } as CSSProperties;

  return (
    <Link href={link} className={styles.card} style={style}>
      <div className={styles.image}>
        {Icon ? (
          <Icon width={60} height={60} role="img" aria-label={`${title} icon`} />
        ) : image ? (
          <Image src={image} alt={title} width={60} height={60} loading="lazy" />
        ) : null}
      </div>
      <div className={styles.title}>{title}</div>
    </Link>
  );
}
