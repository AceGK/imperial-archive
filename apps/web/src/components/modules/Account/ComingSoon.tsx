import type { ComponentType, SVGProps } from "react";
import Button from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";
import styles from "./styles.module.scss";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  features: string[];
};

export default function ComingSoon({ title, description, icon: Icon, features }: ComingSoonProps) {
  return (
    <>
      <SectionHeader title={title} description={description} />

      <section className={`${styles.card} ${styles.comingSoon}`}>
        <span className={styles.comingSoonIcon}>
          <Icon />
        </span>
        <h2>Coming Soon</h2>
        <p className={styles.cardDescription}>
          We&apos;re still building this. Here&apos;s what&apos;s planned:
        </p>
        <ul className={styles.featureList}>
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <Button href="/books" variant="secondary">
          Browse Books
        </Button>
      </section>
    </>
  );
}
