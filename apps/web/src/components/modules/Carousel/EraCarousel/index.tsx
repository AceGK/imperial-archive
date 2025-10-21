"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel";
import type { SwiperOptions } from "swiper/types";
// import BookCard from "@/components/modules/BookCard";
// import type { Book } from "@/lib/40k-books";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  // eras: Era[];
  className?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
};

const breakpoints: SwiperOptions["breakpoints"] = {
  480:  { slidesPerView: 2.1, spaceBetween: 12 },
  640:  { slidesPerView: 3,   spaceBetween: 14 },
  900:  { slidesPerView: 4,   spaceBetween: 16 },
  1200: { slidesPerView: 5,   spaceBetween: 18 },
};

export default function BookCarousel({
  title,
  subtitle,
  // books,
  className,
  viewAllLink,
  viewAllLabel = "View All Eras",
}: Props) {
  // const items = books.map((b) => (
  //   <BookCard key={b.id} book={b} compact={compact} />
  // ));

  return (
    <Carousel
      title={title}
      subtitle={subtitle}
      items={[]}
      slidesPerView={1.2}
      spaceBetween={12}
      breakpoints={breakpoints}
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllLabel={viewAllLabel} 
    />
  );
}
