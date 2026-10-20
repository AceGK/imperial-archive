import type { ReactNode } from "react";
import styles from "./styles.module.scss";

/**
 * Page header used on the info pages: a small Administratum label, the gold
 * title, optional extra content (e.g. a post's date and author), and a divider.
 */
export default function InfoHeader({
  label,
  title,
  children,
  className,
}: {
  /** e.g. "Adeptus Administratum · IA-003 // Catechism" */
  label?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Extra class for the outer header, e.g. to set its width */
  className?: string;
}) {
  return (
    <header className={className ? `${styles.header} ${className}` : styles.header}>
      {label && <div className={styles.ref}>{label}</div>}
      <h1 className={styles.title}>{title}</h1>
      {children && <div className={styles.extra}>{children}</div>}
      <div className={styles.divider} />
    </header>
  );
}
