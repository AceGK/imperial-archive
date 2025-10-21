'use client';

import React from "react";
import styles from "./styles.module.scss";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from "swiper/modules";
import type { SwiperOptions } from "swiper/types";
import Link from "next/link";
import Button from "@/components/ui/Button";

type CarouselProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Slides to render (each item becomes a SwiperSlide) */
  items: React.ReactNode[];
  /** Generic Swiper options you can override/preset */
  slidesPerView?: number;
  spaceBetween?: number;
  breakpoints?: SwiperOptions["breakpoints"];
  loop?: boolean;
  autoplay?: false | { delay?: number; pauseOnMouseEnter?: boolean; disableOnInteraction?: boolean };
  navigation?: boolean;
  pagination?: boolean;
  className?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
  lastSlideTitle?: string; // defaults to "View All"
};

export default function Carousel({
  title,
  subtitle,
  items,
  slidesPerView = 1.2,
  spaceBetween = 12,
  breakpoints,
  loop = false,
  autoplay = false,
  navigation = true,
  pagination = true,
  className,
  viewAllLink,
  viewAllLabel,
  lastSlideTitle = "View All",
}: CarouselProps) {
  return (
    <div className={`${styles.wrap} ${className || ""}`}>
      {(title || subtitle) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}

      <Swiper
        modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        breakpoints={breakpoints}
        loop={loop}
        autoplay={autoplay || undefined}
        navigation={navigation}
        pagination={pagination ? { clickable: true } : false}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true }}
        className={styles.swiper}
      >
        {items.map((node, i) => (
          <SwiperSlide key={i} className={styles.slide}>
            {node}
          </SwiperSlide>
        ))}
         {viewAllLink && (
          <SwiperSlide className={`${styles.slide} ${styles.viewAllSlide}`}>
            <Link href={viewAllLink} className={styles.viewAllCard} aria-label={lastSlideTitle}>
              <span className={styles.viewAllTitle}>{lastSlideTitle}</span>
            </Link>
          </SwiperSlide>
        )}
      </Swiper>
      {viewAllLink && (
        <div className={styles.viewAll}>
          <Button href={viewAllLink} variant="primary" size="sm">
          {viewAllLabel ? viewAllLabel : "View All"}
          </Button>
        </div>
      )}
    </div>
  );
}
