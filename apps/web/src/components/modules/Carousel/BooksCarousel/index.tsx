// /src/components/modules/Carousel/BooksCarousel/index.tsx
"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import type { SwiperOptions } from "swiper/types";
import BookCard from "@/components/modules/Cards/BookCard";
import type { Book40k } from "@/types/sanity";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  books: Book40k[]; 
  className?: string;
  compact?: boolean;
  viewAllLink?: string; 
  viewAllLabel?: string;
};

const breakpoints: SwiperOptions["breakpoints"] = {
  480:  { slidesPerView: 2.1, spaceBetween: 12 },
  640:  { slidesPerView: 3,   spaceBetween: 14 },
  900:  { slidesPerView: 4,   spaceBetween: 16 },
  1200: { slidesPerView: 5,   spaceBetween: 18 },
};

export default function BooksCarousel({
  title,
  subtitle,
  books,
  className,
  compact = false,
  viewAllLink,
  viewAllLabel = "View All Books",
}: Props) {
  const items = books.map((b) => (
    <BookCard key={b._id} book={b} compact={compact} />
  ));

  return (
    <Carousel
      title={title}
      subtitle={subtitle}
      items={items}
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
