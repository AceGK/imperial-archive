import type { ReactNode } from "react";
import styles from "./styles.module.scss";

type BaseProps = {
  media?: ReactNode; // avatar/icon block
  overline?: ReactNode; // small line above title (e.g., group link)
  title: ReactNode; // <h1> or <h2>
  description?: ReactNode; // rich text; can include <Clamp>
  actions?: ReactNode; // links/icons list
  footer?: ReactNode; // chips, metadata, etc.
  className?: string;
};

export default function ProfileBase({
  media,
  overline,
  title,
  description,
  actions,
  footer,
  className,
}: BaseProps) {
  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      {media && <div className={styles.media}>{media}</div>}
      <div className={styles.content}>
        {overline && <div className={styles.overline}>{overline}</div>}
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
