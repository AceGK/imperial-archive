import type { ReactNode } from "react";
import Toc, { type TocItem } from "./index";
import styles from "./styles.module.scss";

/**
 * Page layout with a sticky "Contents" rail beside the main column.
 * Each item's `id` must match the id of a section on the page.
 */
export default function TocLayout({ items, children }: { items: TocItem[]; children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <aside className={styles.aside}>
        <Toc items={items} />
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
