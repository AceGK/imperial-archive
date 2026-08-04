// /src/components/modules/Carousel/SeriesCarousel/index.tsx
"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import type { SwiperOptions } from "swiper/types";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import type { Series40kDoc } from "@/types/sanity";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  series: Pick<Series40kDoc, "_id" | "title" | "slug" | "image" | "totalCount">[];
  className?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
};

const breakpoints: SwiperOptions["breakpoints"] = {
  320: { slidesPerView: 1.3, spaceBetween: 12 },
  480: { slidesPerView: 1.8, spaceBetween: 12 },
  640: { slidesPerView: 2.3, spaceBetween: 14 },
  900: { slidesPerView: 3, spaceBetween: 16 },
  1200: { slidesPerView: 4, spaceBetween: 18 },
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
      slidesPerView={1.3}
      spaceBetween={12}
      breakpoints={breakpoints}
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllLabel={viewAllLabel}
      lastSlideTitle="All Series"
    />
  );
}
