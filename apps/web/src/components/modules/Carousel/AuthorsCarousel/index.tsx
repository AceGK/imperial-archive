"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import type { SwiperOptions } from "swiper/types";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
import type { Author40k } from "@/types/sanity";

export type Author = {
  id: string | number;
  name: string;
  slug: string;
  booksCount?: number; 
  count?: number;
  image?: {
    url: string;
    lqip?: string;
    aspect?: number;
  }
};

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  authors: Author[];
  className?: string;
};

const breakpoints: SwiperOptions["breakpoints"] = {
  320: { slidesPerView: 2.2, spaceBetween: 8 },
  480: { slidesPerView: 2.5, spaceBetween: 12 },
  640: { slidesPerView: 3, spaceBetween: 14 },
  900: { slidesPerView: 4, spaceBetween: 16 },
  1200: { slidesPerView: 5, spaceBetween: 18 },
};

export default function AuthorCarousel({
  title,
  subtitle,
  authors,
  className,
}: Props) {
  const items = authors.map((a) => {
    const count = a.count ?? a.booksCount ?? 0; // map -> AuthorCard's `count`
    return <AuthorCard key={a.id} name={a.name} slug={a.slug} count={count} image={a.image} />;
  });

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
        viewAllLink="/authors"
        lastSlideTitle="All Authors"
        viewAllLabel="View All Authors" 
      />

  );
}
