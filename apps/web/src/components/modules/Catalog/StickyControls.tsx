// components/modules/Catalog/StickyControls.tsx
import React from "react";
import styles from "./styles.module.scss";

interface StickyControlsProps {
  children: React.ReactNode;
}

/** The catalog's search, filter and sort bar; sticks just under the nav. */
export default function StickyControls({ children }: StickyControlsProps) {
  return (
    <div className={styles.controls}>
      <div className="container">
        <div className={styles.controlsInner}>{children}</div>
      </div>
    </div>
  );
}
