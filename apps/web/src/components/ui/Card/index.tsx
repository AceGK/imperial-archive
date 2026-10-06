import type { ElementType, ReactNode } from "react";
import styles from "./styles.module.scss";

export type CardProps = {
  /** Small label above the title, e.g. "§ I · Archive" */
  eyebrow?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  as?: ElementType;
  className?: string;
};

export default function Card({
  eyebrow,
  title,
  children,
  align = "left",
  as = "div",
  className,
}: CardProps) {
  const Comp = as;
  return (
    <Comp
      className={`${styles.card} ${align === "center" ? styles.center : ""} ${className ?? ""}`}
    >
      {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
      {title && <h2 className={styles.title}>{title}</h2>}
      {children && <div className={styles.body}>{children}</div>}
    </Comp>
  );
}

/* ------------------------------------------------------------------
   Usage examples

   import Card from "@/components/ui/Card";

   // 1) Basic text card
   <Card eyebrow="§ I · Archive" title="The Archive">
     <p>Body copy, links, lists, etc.</p>
   </Card>

   // 2) Centered (e.g. a short contact/CTA block)
   <Card eyebrow="§ IV · Vox" title="Contact" align="center">
     <a href="mailto:hello@example.com">hello@example.com</a>
   </Card>

   // 3) Stack multiple in a column with spacing on the parent
   <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
     <Card title="First">...</Card>
     <Card title="Second">...</Card>
   </div>
------------------------------------------------------------------- */
