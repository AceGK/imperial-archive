// /components/modules/Carousel/FactionCarousel/client.tsx  (client)
"use client";

import React, { useMemo, useState } from "react";
import Carousel from "@/components/modules/Carousel";
import type { SwiperOptions } from "swiper/types";
import FactionCard from "@/components/modules/FactionCard";
import { resolveGroupIcon } from "@/components/icons/factions/resolve";
import styles from "./styles.module.scss";
import carouselStyles from "@/components/modules/Carousel/styles.module.scss";

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
  const defaultKey = initialGroupKey || groups[0]?.key;
  const [activeKey, setActiveKey] = useState<string>(defaultKey);

  const activeGroup = useMemo(
    () => groups.find(g => g.key === activeKey) || groups[0],
    [groups, activeKey]
  );

  const items = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.items.map(f => (
      <FactionCard
        key={f._id}
        title={f.title}
        slug={f.slug}
        iconId={f.iconId}
        group={activeGroup.key}
      />
    ));
  }, [activeGroup]);

  const viewAllLink = basePath;          // "/factions"
  const viewAllLabel = "View All Factions";

  return (
    <div className={`${styles.wrap} ${className || ""}`}>
      {(title || subtitle) && (
        <header className={carouselStyles.header}>
          {title && <h2 className={carouselStyles.title}>{title}</h2>}
          {subtitle && <p className={carouselStyles.subtitle}>{subtitle}</p>}
        </header>
      )}

      <div className={styles.tabs} role="tablist" aria-label="Faction groups">
        {groups.map(g => {
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
              {GroupIcon && <GroupIcon width={18} height={18} className={styles.tabIcon} />}
              <span className={styles.tabLabel}>{g.meta.title}</span>
            </button>
          );
        })}
      </div>

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
