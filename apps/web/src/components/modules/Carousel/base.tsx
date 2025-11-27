// components/modules/Carousel/base/index.tsx
'use client';

import React, { useRef } from "react";
import styles from "./styles.module.scss";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from "swiper/modules";
import type { SwiperOptions } from "swiper/types";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ChevronLeft from "@/components/icons/chevron-left.svg";
import ChevronRight from "@/components/icons/chevron-right.svg";

type CarouselProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerSlot?: React.ReactNode;
  items: React.ReactNode[];
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
  lastSlideTitle?: string;
  showLastSlide?: boolean;
};

export default function Carousel({
  title,
  subtitle,
  headerSlot,
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
  showLastSlide = true,
}: CarouselProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`${styles.wrap} ${className || ""}`}>
      {(title || subtitle) && (
        <header className={styles.header}>
          {title && (
            <h2 className={`${styles.title} ${subtitle ? styles.hasSubtitle : ''}`}>
              {title}
            </h2>
          )}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}
      
      {headerSlot}

      <div className={styles.carouselContainer}>
        {navigation && (
          <>
            <button 
              ref={prevRef} 
              className={styles.navPrev} 
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              ref={nextRef} 
              className={styles.navNext} 
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <Swiper
          modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
          slidesPerView={slidesPerView}
          spaceBetween={spaceBetween}
          breakpoints={breakpoints}
          loop={loop}
          autoplay={autoplay || undefined}
          navigation={navigation ? {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          } : false}
          onBeforeInit={(swiper) => {
            if (navigation && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }
          }}
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
          {viewAllLink && showLastSlide && (
            <SwiperSlide className={`${styles.slide} ${styles.viewAllSlide}`}>
              <Link href={viewAllLink} className={styles.viewAllCard} aria-label={lastSlideTitle}>
                <span className={styles.viewAllTitle}>{lastSlideTitle}</span>
              </Link>
            </SwiperSlide>
          )}
        </Swiper>
      </div>

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