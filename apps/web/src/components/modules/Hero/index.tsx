import React from "react";
import Image from "next/image";
import styles from "./styles.module.scss";
import type { Image as SanityImage } from "sanity";
import { urlFor } from "@/lib/sanity/sanity.image";

type HeroProps = {
  /** Background image path or URL */
  image: string | SanityImage;
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
  children?: React.ReactNode;
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
  children,
}: HeroProps) {
  
  const sectionClass = [
    styles.hero,
    styles[`align-${align}`],
    styles[`height-${height}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

   // Build URL if given a Sanity image object
  const src =
    typeof image === "string"
      ? image
      : urlFor(image).width(2400).auto("format").url();

  return (
    <section
      className={sectionClass}
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className={styles.media}>
        <Image
          src={src}
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
        {children}
      </div>
    </section>
  );
}
