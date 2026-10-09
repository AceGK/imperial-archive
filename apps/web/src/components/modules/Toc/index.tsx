"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import styles from "./styles.module.scss";

export type TocItem = { id: string; index: string; label: string };

// a section becomes active once its top passes this fraction of the viewport
const READING_LINE = 0.33;
// fallback for browsers without the `scrollend` event
const CLICK_LOCK_MS = 1000;

export default function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const isNavVisible = useScrollVisibility();
  const clickLock = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      if (clickLock.current) return;

      const sections = items
        .map(({ id }) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
      if (!sections.length) return;

      // short final sections can never reach the reading line, so the bottom
      // of the page always belongs to the last one
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(sections[sections.length - 1].id);
        return;
      }

      const line = window.innerHeight * READING_LINE;
      let current = sections[0].id;
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // no recompute on unlock: near the bottom of the page that would move the
    // highlight off the entry the reader just clicked
    const unlock = () => {
      clearTimeout(lockTimer.current);
      clickLock.current = false;
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("scrollend", unlock);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(lockTimer.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scrollend", unlock);
    };
  }, [items]);

  // highlight the clicked entry right away and hold it while the page scrolls
  // there, so the highlight doesn't flicker through the sections in between
  const handleClick = (id: string) => () => {
    setActiveId(id);
    clickLock.current = true;
    clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      clickLock.current = false;
    }, CLICK_LOCK_MS);
  };

  return (
    <nav
      className={`${styles.toc} ${isNavVisible ? styles.navVisible : ""}`}
      aria-label="On this page"
    >
      <div className={styles.tocHeading}>Contents</div>
      <ol className={styles.tocList}>
        {items.map(({ id, index, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`${styles.tocLink} ${activeId === id ? styles.tocActive : ""}`}
              aria-current={activeId === id ? "location" : undefined}
              onClick={handleClick(id)}
            >
              <span className={styles.tocIndex}>{index}</span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
