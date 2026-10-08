// components/modules/Carousel/base/index.tsx
'use client';

import React, { useRef } from "react";
import styles from "./styles.module.scss";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper/types";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ChevronLeft from "@/components/icons/chevron-left.svg";
import ChevronRight from "@/components/icons/chevron-right.svg";

type CarouselProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerSlot?: React.ReactNode;
  items: React.ReactNode[];
  /** Slides in view per breakpoint, defined in styles.module.scss */
  layout: "books" | "series" | "authors" | "factions" | "eras";
  loop?: boolean;
  autoplay?: false | { delay?: number; pauseOnMouseEnter?: boolean; disableOnInteraction?: boolean };
  navigation?: boolean;
  pagination?: boolean;
  className?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
  lastSlideTitle?: string;
  /** Icon on the "View All" last slide, e.g. the nav icon for this content type */
  viewAllIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  showLastSlide?: boolean;
};

export default function Carousel({
  title,
  subtitle,
  headerSlot,
  items,
  layout,
  loop = false,
  autoplay = false,
  navigation = true,
  pagination = true,
  className,
  viewAllLink,
  viewAllLabel,
  lastSlideTitle = "View All",
  viewAllIcon: ViewAllIcon,
  showLastSlide = true,
}: CarouselProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);

  return (
    <div className={`${styles.wrap} ${styles[layout]} ${className || ""}`}>
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

      {/* Swiper's keyboard control listens page-wide and would move every
          carousel on screen at once, so it's only on while focus is inside
          this one (e.g. after tabbing to a card or an arrow button) */}
      <div
        className={styles.carouselContainer}
        onFocus={() => swiperRef.current?.keyboard.enable()}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            swiperRef.current?.keyboard.disable();
          }
        }}
      >
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
          // slide widths and gaps come from CSS (see styles.module.scss)
          slidesPerView="auto"
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
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          keyboard={{ enabled: false }}
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
                {ViewAllIcon && <ViewAllIcon className={styles.viewAllIcon} aria-hidden="true" />}
                <span className={styles.viewAllTitle}>{lastSlideTitle}</span>
              </Link>
            </SwiperSlide>
          )}
        </Swiper>
      </div>

      {viewAllLink && (
        <div className={styles.viewAll}>
          <Button href={viewAllLink} variant="bracket" size="lg">
            {viewAllLabel ? viewAllLabel : "View All"}
          </Button>
        </div>
      )}
    </div>
  );
}