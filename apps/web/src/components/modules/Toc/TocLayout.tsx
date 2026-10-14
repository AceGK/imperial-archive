import type { ReactNode } from "react";
import Toc, { type TocItem } from "./index";
import styles from "./styles.module.scss";

type TocLayoutProps = {
  items: TocItem[];
  /** The page's title block, across the full width above the rail and the content */
  header?: ReactNode;
  children: ReactNode;
};

/**
 * Page layout with a sticky "Contents" rail beside the main column, under an
 * optional full-width header. Each item's `id` must match the id of a
 * section on the page.
 */
export default function TocLayout({ items, header, children }: TocLayoutProps) {
  return (
    <div className={styles.page}>
      {header}
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <Toc items={items} />
        </aside>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
