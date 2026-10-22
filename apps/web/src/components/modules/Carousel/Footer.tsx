"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSwiper } from "swiper/react";
import Button from "@/components/ui/Button";
import styles from "./Footer.module.scss";

type CarouselFooterProps = {
  href?: string;
  label?: string;
  /** Required by Swiper to render this after the slides; pass "container-end" */
  slot?: string;
};

// Dynamic dots, used only when the full row doesn't fit beside the link: at
// most this many show at once, in a window that slides with the active page.
// Keep these in sync with the --dot* and --visible values in Footer.module.scss.
const VISIBLE_DOTS = 5;
const DOT = 8;
const DOT_ACTIVE = 20;
const DOT_GAP = 6;
const FOOTER_GAP = 12;

const rowWidth = (count: number) => count * DOT + (count - 1) * DOT_GAP + (DOT_ACTIVE - DOT);

/**
 * Page dots (left) and "View All" (right) under a carousel on phones, where
 * the arrows and the centered View All button are hidden. Render it inside
 * <Swiper> with slot="container-end" so it can read the slider through
 * useSwiper().
 */
export default function CarouselFooter({ href, label = "View All" }: CarouselFooterProps) {
  const swiper = useSwiper();
  const [pages, setPages] = useState(0);
  const [active, setActive] = useState(0);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const linkRef = useRef<HTMLSpanElement | null>(null);
  const [rowFits, setRowFits] = useState(true);

  // whether every dot fits in the space left beside the link
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || pages <= VISIBLE_DOTS) return;
    const measure = () => {
      if (!footer.clientWidth) return; // hidden above phone width
      const linkWidth = linkRef.current?.offsetWidth ?? 0;
      const available = footer.clientWidth - (linkWidth ? linkWidth + FOOTER_GAP : 0);
      setRowFits(rowWidth(pages) <= available);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    if (linkRef.current) observer.observe(linkRef.current);
    return () => observer.disconnect();
  }, [pages]);

  useEffect(() => {
    if (!swiper) return;
    // useSwiper() can hand over the instance before it has initialized, when
    // snapGrid doesn't exist yet; "init" fires once it does
    const update = () => {
      setPages(swiper.snapGrid?.length ?? 0);
      setActive(swiper.snapIndex ?? 0);
    };
    update();
    const events = ["init", "slideChange", "snapGridLengthChange", "resize", "breakpoint"] as const;
    events.forEach((event) => swiper.on(event, update));
    return () => {
      events.forEach((event) => swiper.off(event, update));
    };
  }, [swiper]);

  const goTo = (page: number) => {
    if (!swiper) return;
    const group = Number(swiper.params.slidesPerGroup) || 1;
    swiper.slideTo(Math.min(page * group, swiper.slides.length - 1));
  };

  if (pages <= 1 && !href) return null;

  // the window of visible dots keeps the active one centered where possible
  const dynamic = pages > VISIBLE_DOTS && !rowFits;
  const start = dynamic ? Math.min(Math.max(active - Math.floor(VISIBLE_DOTS / 2), 0), pages - VISIBLE_DOTS) : 0;
  const end = dynamic ? start + VISIBLE_DOTS - 1 : pages - 1;

  return (
    <div ref={footerRef} className={styles.footer}>
      {pages > 1 ? (
        <div className={`${styles.dots} ${dynamic ? styles.dynamic : ""}`} role="group" aria-label="Carousel pages">
          <div className={styles.track} style={{ "--start": start } as CSSProperties}>
            {Array.from({ length: pages }, (_, i) => {
              const inWindow = i >= start && i <= end;
              // edge dots shrink when more pages lie beyond them
              const small = dynamic && ((i === start && start > 0) || (i === end && end < pages - 1));
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dot} ${small ? styles.small : ""}`}
                  aria-label={`Go to page ${i + 1} of ${pages}`}
                  aria-current={i === active ? "true" : undefined}
                  aria-hidden={inWindow ? undefined : true}
                  tabIndex={inWindow ? undefined : -1}
                  onClick={() => goTo(i)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <span />
      )}
      {href && (
        <span ref={linkRef} className={styles.link}>
          <Button href={href} variant="secondary" size="sm">
            {label}
          </Button>
        </span>
      )}
    </div>
  );
}
