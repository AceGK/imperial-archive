import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import styles from "./styles.module.scss";

type ComingSoonProps = {
  /** Page label above the title, e.g. "Adeptus Administratum · IA-003 // Catechism" */
  eyebrow?: string;
  title: string;
  description: ReactNode;
};

/** Placeholder page with the same header as the about and support pages */
export default function ComingSoon({ eyebrow, title, description }: ComingSoonProps) {
  return (
    <main>
      <section className="container row__lg">
        <div className={styles.content}>
          <header className={styles.header}>
            {eyebrow && <div className={styles.ref}>{eyebrow}</div>}
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.divider} />
          </header>

          <Card title="Coming Soon" align="center">
            <p>{description}</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
