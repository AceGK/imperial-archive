import Link from "next/link";
import FactionTheme from "@/components/modules/FactionTheme";
import { resolveGroupIcon, resolveIcon } from "@/components/icons/factions/resolve";
import DetailCard from "../base";
import Clamp from "../clamp";
import DetailLinks from "../links";
import type { Faction40kDoc } from "@/types/sanity";
import styles from "../styles.module.scss"

export default function FactionDetailCard({ faction }: { faction: Faction40kDoc }) {
  const GroupIcon = resolveGroupIcon(faction.group?.iconId || "");
  const FactionIcon = resolveIcon(faction.iconId || faction.slug);

  const overline = faction.group ? (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {GroupIcon && <GroupIcon width={24} height={24} />}
      <Link href={`/factions/${faction.group.slug}`}>{faction.group.title}</Link>
    </div>
  ) : null;

  const media = FactionIcon ? (
    <FactionTheme slugOrIconId={faction.iconId || faction.slug}>
      <div className={styles.factionImage} aria-hidden="true">
        <FactionIcon width={120} height={100} role="img" aria-label={`${faction.title} icon`} />
      </div>
    </FactionTheme>
  ) : null;

  const links = (faction.links ?? []).filter((l) => l?.url);

  return (
    <DetailCard
      media={media}
      // overline={overline}
      title={<h1>{faction.title}</h1>}
      description={
        faction.description ? (
          <Clamp>
            <p>{faction.description}</p>
          </Clamp>
        ) : null
      }
      actions={<DetailLinks items={links as any} />}
    />
  );
}
