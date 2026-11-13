// /components/modules/Carousel/FactionCarousel/client.tsx  (client)
"use client";

import React, { useMemo, useState } from "react";
import Carousel from "@/components/modules/Carousel/base";
// the card without its icon lookup, and icons fetched one by one as they show:
// the full icon registry would put every faction icon in this bundle
import FactionCardView from "@/components/modules/Cards/FactionCard/Card";
import LazyFactionIcon from "@/components/icons/factions/LazyFactionIcon";
import styles from "./styles.module.scss";
import ShieldIcon from "@/components/icons/shield.svg";

type GroupMeta = { title: string; iconId?: string; description?: string };
type AdaptedGroup = {
  key: string;                 // group slug
  meta: GroupMeta;
  items: { _id: string; title: string; slug: string; iconId?: string }[];
};

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  groups: AdaptedGroup[];
  initialGroupKey?: string;
  basePath?: string;           // not used in links now (we build /factions/{group}/{slug})
  className?: string;
};

export default function FactionCarouselClient({
  title,
  subtitle,
  groups,
  initialGroupKey,
  basePath = "/factions",
  className,
}: Props) {
  const defaultKey = initialGroupKey || groups[0]?.key;
  const [activeKey, setActiveKey] = useState<string>(defaultKey);

  const activeGroup = useMemo(
    () => groups.find(g => g.key === activeKey) || groups[0],
    [groups, activeKey]
  );

  const items = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.items.map(f => (
      <FactionCardView
        key={f._id}
        title={f.title}
        slug={f.slug}
        themeKey={f.iconId || f.slug}
        icon={<LazyFactionIcon id={f.iconId || f.slug} width={80} height={80} aria-hidden />}
        group={activeGroup.key}
      />
    ));
  }, [activeGroup]);

  const viewAllLink = basePath;          // "/factions"
  const viewAllLabel = "View All Factions";

  return (
    <div className={`${styles.wrap} ${className || ""}`}>
      <Carousel
        title={title}
        subtitle={subtitle}
        items={items}
        layout="factions"
        loop={false}
        autoplay={false}
        navigation
        className={styles.carousel}
        viewAllLink={viewAllLink}
        viewAllIcon={ShieldIcon}
        viewAllLabel={viewAllLabel}
        resetKey={activeGroup?.key}
        headerSlot={
          <div className={styles.tabs} role="tablist" aria-label="Faction groups">
            {groups.map(g => {
              const isActive = g.key === activeKey;
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tab} ${isActive ? styles.active : ""}`}
                  onClick={() => setActiveKey(g.key)}
                >
                  <LazyFactionIcon id={g.meta.iconId} width={18} height={18} className={styles.tabIcon} />
                  <span className={styles.tabLabel}>{g.meta.title}</span>
                </button>
              );
            })}
          </div>
        }
      />
    </div>
  );
}