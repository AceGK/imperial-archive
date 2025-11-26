// /components/modules/FactionCard/index.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import { resolveIcon } from "@/components/icons/factions/resolve";
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
  const Icon = resolveIcon(iconId || slug);
  const href = toHref(slug, group);
  const themeKey = iconId || slug;

  return (
    <FactionTheme
      slugOrIconId={themeKey}
      as={Link}
      href={href}
      className={`${styles.card} ${className ?? ""}`}
      aria-label={`Open ${title}`}
    >
      <div className={styles.imageWrap}>
        {Icon && (
          <div className={styles.icon}>
            <Icon width={80} height={80} aria-hidden />
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>{title}</div>
      </div>
    </FactionTheme>
  );
}
