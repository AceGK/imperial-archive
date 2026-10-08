"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
import type { Author40k } from "@/types/sanity";
import UserIcon from "@/components/icons/user.svg";

export type Author = {
  id: string | number;
  name: string;
  slug: string;
  booksCount?: number;
  count?: number;
  image?: {
    asset?: { _ref?: string; _id?: string; url?: string } | null;
    crop?: { top: number; bottom: number; left: number; right: number } | null;
    hotspot?: { x: number; y: number; height: number; width: number } | null;
    alt?: string | null;
    lqip?: string | null;
  } | null;
};

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  authors: Author[];
  className?: string;
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
        layout="authors"
        loop={false}
        autoplay={false}
        navigation
        pagination={false}
        className={className}
        viewAllLink="/authors"
        viewAllIcon={UserIcon}
        lastSlideTitle="All Authors"
        viewAllLabel="View All Authors" 
      />

  );
}
