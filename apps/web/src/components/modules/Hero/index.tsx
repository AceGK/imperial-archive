import React from "react";
import Image from "next/image";
import styles from "./styles.module.scss";
import Search from "@/components/modules/Search";

// Data
import Books from "../../../../data/40k-books.json";
import RawFactions from "../../../../data/40k-factions.json";

// Normalizer
import { flattenFactions } from "@/lib/flatten-factions";

type HeroProps = {
  /** Background image path or URL */
  image: string;
  /** Alt text (leave empty if decorative) */
  alt?: string;
  /** Main heading */
  title: React.ReactNode;
  /** One-line subheading/description */
  subtitle?: React.ReactNode;
  /** Optional: improve LCP when above-the-fold */
  priority?: boolean;
  /** Optional alignment */
  align?: "left" | "center" | "right";
  /** Optional height preset */
  height?: "sm" | "md" | "lg" | "xl";
  /** Extra class hook */
  className?: string;
};

export default function Hero({
  image,
  alt = "",
  title,
  subtitle,
  priority = false,
  align = "left",
  height = "lg",
  className = "",
}: HeroProps) {
  // Normalize factions once on the server (pure + cheap)
  const factions = flattenFactions(RawFactions as any);

  const sectionClass = [
    styles.hero,
    styles[`align-${align}`],
    styles[`height-${height}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={sectionClass}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className={styles.media}>
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className={styles.image}
        />
        <div className={styles.scrim} />
      </div>

      <div className={`${styles.inner} container`}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

        {/* Pass both datasets to Search */}
        <Search
          books={Books as any}
          factions={factions}
          placeholder="Search the Archive..."
        />
      </div>
    </section>
  );
}
