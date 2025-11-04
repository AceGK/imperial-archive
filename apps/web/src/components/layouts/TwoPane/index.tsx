// Renders a sticky left sidebar and a flexible right content area.
import styles from "./styles.module.scss";
import type { ReactNode } from "react";

type ProfileLayoutProps = {
  sidebar: ReactNode;          // left column (entity profile card)
  children: ReactNode;         // right column (books grid, etc.)
  className?: string;          // optional wrapper class
};

export default function TwoPane({ sidebar, children, className }: ProfileLayoutProps) {
  return (
    <section className={`${styles.layout} ${className ?? ""}`}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <div className={styles.content}>{children}</div>
    </section>
  );
}