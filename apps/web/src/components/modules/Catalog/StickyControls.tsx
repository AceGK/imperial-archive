// components/modules/SearchContent/StickyControls.tsx
"use client";

import React from "react";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import styles from "./styles.module.scss";

interface StickyControlsProps {
  children: React.ReactNode;
}

export default function StickyControls({ children }: StickyControlsProps) {
  const isNavVisible = useScrollVisibility();
  const [isSticky, setIsSticky] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const shouldTranslate = isSticky && isNavVisible;

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} />
      <div className={`${styles.controls} ${shouldTranslate ? styles.navVisible : ""}`}>
        <div className="container">
          <div className={styles.controlsInner}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}