// /src/components/modules/Carousel/SeriesCarousel/index.tsx
"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import type { Series40kDoc } from "@/types/sanity";
import LayersIcon from "@/components/icons/layers.svg";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  series: Pick<Series40kDoc, "_id" | "title" | "slug" | "image" | "totalCount">[];
  className?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
};

export default function SeriesCarousel({
  title,
  subtitle,
  series,
  className,
  viewAllLink = "/series",
  viewAllLabel = "View All Series",
}: Props) {
  const items = series.map((s) => (
    <SeriesCard
      key={s._id}
      title={s.title}
      slug={s.slug}
      image={s.image}
      countLabel={
        s.totalCount != null
          ? `${s.totalCount} ${s.totalCount === 1 ? "Work" : "Works"}`
          : undefined
      }
    />
  ));

  return (
    <Carousel
      title={title}
      subtitle={subtitle}
      items={items}
      layout="series"
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllIcon={LayersIcon}
      viewAllLabel={viewAllLabel}
      lastSlideTitle="All Series"
    />
  );
}
