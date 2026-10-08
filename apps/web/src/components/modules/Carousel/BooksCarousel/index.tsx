// /src/components/modules/Carousel/BooksCarousel/index.tsx
"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import BookCard from "@/components/modules/Cards/BookCard";
import type { Book40k } from "@/types/sanity";
import BookIcon from "@/components/icons/book.svg";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  books: Book40k[]; 
  className?: string;
  compact?: boolean;
  viewAllLink?: string; 
  viewAllLabel?: string;
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
      layout="books"
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllIcon={BookIcon}
      viewAllLabel={viewAllLabel}
    />
  );
}
