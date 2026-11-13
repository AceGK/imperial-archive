// /components/modules/Cards/FactionCard/Card.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import FactionTheme from "@/components/modules/FactionTheme";

type Props = {
  title: string;
  slug: string;
  group?: string;
  /** Theme key for the card colors: the faction's iconId, else its slug */
  themeKey: string;
  /** The faction icon, already rendered (80×80) */
  icon?: React.ReactNode;
  className?: string;
};

function toHref(slug: string, group?: string) {
  if (slug.includes("/")) return slug;
  return group ? `/factions/${group}/${slug}` : `/factions/${slug}`;
}

/**
 * The faction card without its icon lookup, for client components, which pass
 * a LazyFactionIcon; the default FactionCard looks the icon up itself.
 */
export default function FactionCardView({ title, slug, group, themeKey, icon, className }: Props) {
  return (
    <FactionTheme
      slugOrIconId={themeKey}
      as={Link}
      href={toHref(slug, group)}
      className={`${styles.card} ${className ?? ""}`}
      aria-label={`Open ${title}`}
    >
      <div className={styles.imageWrap}>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>{title}</div>
      </div>
    </FactionTheme>
  );
}
