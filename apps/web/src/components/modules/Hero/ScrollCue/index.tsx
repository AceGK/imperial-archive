"use client";

import { useEffect, useState } from "react";
import ChevronDown from "@/components/icons/chevron-down.svg";
import styles from "./styles.module.scss";

/** Scrolled further than this share of the screen height, the cue fades out */
const HIDE_AFTER = 0.1;

/** Bottom-of-hero button that scrolls to whatever follows the hero */
export default function ScrollCue({ label = "Scroll" }: { label?: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setHidden(window.scrollY > window.innerHeight * HIDE_AFTER);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function scrollPast(e: React.MouseEvent<HTMLButtonElement>) {
    const hero = e.currentTarget.closest("section");
    if (!hero) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // the sticky nav hides itself on scroll down, so no offset for it
    window.scrollTo({
      top: hero.getBoundingClientRect().bottom + window.scrollY,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <button
      type="button"
      className={`${styles.cue} ${hidden ? styles.hidden : ""}`}
      onClick={scrollPast}
      aria-label="Scroll to content"
      tabIndex={hidden ? -1 : undefined}
    >
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
      <span className={styles.box} aria-hidden="true">
        <ChevronDown className={styles.icon} />
      </span>
    </button>
  );
}
