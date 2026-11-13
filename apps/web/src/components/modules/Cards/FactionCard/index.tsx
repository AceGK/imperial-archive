// /components/modules/FactionCard/index.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import FactionIcon from "@/components/icons/factions/FactionIcon";
import FactionTheme from "@/components/modules/FactionTheme";

type Props = {
  title: string;
  slug: string;
  group?: string;
  iconId?: string;
  className?: string;
};

function toHref(slug: string, group?: string) {
  if (slug.includes("/")) return slug;
  return group ? `/factions/${group}/${slug}` : `/factions/${slug}`;
}

export default function FactionCard({
  title,
  slug,
  group,
  iconId,
  className,
}: Props) {
  const themeKey = iconId || slug;

  return (
    <FactionTheme
      slugOrIconId={themeKey}
      as={Link}
      href={toHref(slug, group)}
      className={`${styles.card} ${className ?? ""}`}
      aria-label={`Open ${title}`}
    >
      <div className={styles.imageWrap}>
        <div className={styles.icon}>
          <FactionIcon id={iconId || slug} className={styles.glyph} />
        </div>
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>{title}</div>
      </div>
    </FactionTheme>
  );
}
