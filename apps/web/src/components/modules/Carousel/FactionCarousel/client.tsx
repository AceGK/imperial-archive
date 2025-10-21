"use client";

import React, { useMemo, useState } from "react";
import carouselStyles from "@/components/modules/Carousel/styles.module.scss";
import styles from "./styles.module.scss";
import Carousel from "@/components/modules/Carousel";
import type { SwiperOptions } from "swiper/types";
import type { GroupedFactions } from "@/lib/40k-factions";
import FactionCard from "@/components/modules/FactionCard";
import { resolveGroupIcon } from "@/components/icons/factions/resolve";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  groups: GroupedFactions[];
  initialGroupKey?: string;
  basePath?: string;
  className?: string;
};

const breakpoints: SwiperOptions["breakpoints"] = {
  480: { slidesPerView: 2.1, spaceBetween: 12 },
  640: { slidesPerView: 3, spaceBetween: 14 },
  900: { slidesPerView: 4, spaceBetween: 16 },
  1200: { slidesPerView: 5, spaceBetween: 18 },
};

export default function FactionCarouselClient({
  title,
  subtitle,
  groups,
  initialGroupKey,
  basePath = "/factions",
  className,
}: Props) {
  const defaultKey = useMemo(
    () => initialGroupKey || groups[0]?.key,
    [initialGroupKey, groups]
  );

  const [activeKey, setActiveKey] = useState<string>(defaultKey);

  const activeGroup = useMemo(
    () => groups.find((g) => g.key === activeKey) || groups[0],
    [groups, activeKey]
  );

  // Build slides using YOUR FactionCard component
  const items = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.items.map((f) => (
      <FactionCard
        key={`${activeGroup.key}-${f.slug}`}
        title={f.title}
        slug={f.slug}
        iconId={f.iconId}
        image={f.image}
        group={activeGroup.key} // ensures /factions/[group]/[slug]
      />
    ));
  }, [activeGroup]);

  // View-All for current group (works with your Carousel’s “last slide” + bottom button)
  // const viewAllLink = `${basePath}/${activeGroup?.key ?? groups[0]?.key}`;
  // const viewAllLabel = `All ${activeGroup?.meta.title ?? "Factions"}`;
  const viewAllLink = basePath; // e.g. "/factions"
  const viewAllLabel = "View All Factions";

  return (
    <div className={`${styles.wrap} ${className || ""}`}>
      {(title || subtitle) && (
        <header className={carouselStyles.header}>
          {title && <h2 className={carouselStyles.title}>{title}</h2>}
          {subtitle && <p className={carouselStyles.subtitle}>{subtitle}</p>}
        </header>
      )}

      {/* Tabs with group icon + title */}
      <div className={styles.tabs} role="tablist" aria-label="Faction groups">
        {groups.map((g) => {
          const GroupIcon = resolveGroupIcon(g.meta.iconId);
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
              {GroupIcon && (
                <GroupIcon width={18} height={18} className={styles.tabIcon} />
              )}
              <span className={styles.tabLabel}>{g.meta.title}</span>
            </button>
          );
        })}
      </div>

      {/* Carousel for selected group */}
      <Carousel
        items={items}
        slidesPerView={1.2}
        spaceBetween={12}
        breakpoints={breakpoints}
        loop={false}
        autoplay={false}
        navigation
        pagination={false}
        className={styles.carousel}
        viewAllLink={viewAllLink}
        viewAllLabel={viewAllLabel}
      />
    </div>
  );
}
