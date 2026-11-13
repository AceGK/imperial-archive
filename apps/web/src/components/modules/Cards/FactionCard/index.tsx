// /components/modules/FactionCard/index.tsx
import { resolveIcon } from "@/components/icons/factions/resolve";
import FactionCardView from "./Card";

type Props = {
  title: string;
  slug: string;
  group?: string;
  iconId?: string;
  className?: string;
};

/**
 * A faction card with its icon looked up from the full icon registry. Fine in
 * server components; client components should use FactionCardView with a
 * LazyFactionIcon, or every faction icon ends up in their JS bundle.
 */
export default function FactionCard({ title, slug, group, iconId, className }: Props) {
  const Icon = resolveIcon(iconId || slug);
  return (
    <FactionCardView
      title={title}
      slug={slug}
      group={group}
      themeKey={iconId || slug}
      icon={Icon ? <Icon width={80} height={80} aria-hidden /> : null}
      className={className}
    />
  );
}
