import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import styles from "./styles.module.scss";

type ComingSoonProps = {
  eyebrow?: string;
  title: string;
  description: ReactNode;
};

export default function ComingSoon({ eyebrow, title, description }: ComingSoonProps) {
  return (
    <main>
      <section className="container row__lg">
        <div className={styles.content}>
          <Card title="Coming Soon" align="center">
            <p>{description}</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
