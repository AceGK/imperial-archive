import Link from "next/link";
import FactionTheme from "@/components/modules/FactionTheme";
import FactionIcon from "@/components/icons/factions/FactionIcon";
import { FACTION_ICON_IDS } from "@/components/icons/factions/ids";
import FavoriteButton from "@/components/modules/FavoriteButton";
import { ShareButton } from "@/components/modules/Share";
import DetailCard from "../base";
import Clamp from "../clamp";
import DetailLinks from "../links";
import type { Faction40kDoc } from "@/types/sanity";
import styles from "../styles.module.scss"

export default function FactionDetailCard({ faction }: { faction: Faction40kDoc }) {
  const iconId = faction.iconId || faction.slug;

  const overline = faction.group ? (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <FactionIcon id={faction.group.iconId} width={24} />
      <Link href={`/factions/${faction.group.slug}`}>{faction.group.title}</Link>
    </div>
  ) : null;

  const media = FACTION_ICON_IDS.has(iconId) ? (
    <FactionTheme slugOrIconId={iconId}>
      <div className={styles.factionImage} aria-hidden="true">
        <FactionIcon id={iconId} width={120} height={100} />
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
      footer={
        <div className={styles.footerActions}>
          <FavoriteButton kind="faction" itemId={faction._id} />
          {faction.group?.slug && (
            <ShareButton
              url={`/factions/${faction.group.slug}/${faction.slug}`}
              title={`${faction.title}: Warhammer 40,000 books`}
            />
          )}
        </div>
      }
    />
  );
}
