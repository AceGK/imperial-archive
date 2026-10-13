// /src/components/modules/Carousel/BlogCarousel/index.tsx
"use client";

import React from "react";
import Carousel from "@/components/modules/Carousel/base";
import BlogCard from "@/components/modules/Cards/BlogCard";
import type { BlogPost } from "@/types/sanity";
import RelayIcon from "@/components/icons/relay.svg";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  posts: BlogPost[];
  className?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
};

export default function BlogCarousel({
  title,
  subtitle,
  posts,
  className,
  viewAllLink = "/blog",
  viewAllLabel = "View All Posts",
}: Props) {
  const items = posts.map((post) => (
    <BlogCard key={post._id} post={post} headingLevel={3} />
  ));

  return (
    <Carousel
      title={title}
      subtitle={subtitle}
      items={items}
      layout="blog"
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllIcon={RelayIcon}
      viewAllLabel={viewAllLabel}
      lastSlideTitle="All Dispatches"
    />
  );
}
