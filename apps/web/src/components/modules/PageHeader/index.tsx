// /components/modules/PageHeader/index.tsx
import Image from "next/image";
import styles from "./styles.module.scss";

export type PageHeaderImage = {
  url: string;
  lqip?: string;
  aspect?: number;
};

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  image?: PageHeaderImage | string | null;
  children?: React.ReactNode;
  align?: "left" | "center";
  height?: "xs" | "sm" | "md" | "lg";
  strongOverlay?: boolean;
  priority?: boolean;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  image,
  children,
  align = "left",
  height = "md",
  strongOverlay = false,
  priority = false,
  className,
}: PageHeaderProps) {
  const rootClass = [styles.wrapper, styles[height], className]
    .filter(Boolean)
    .join(" ");

  const innerClass = ["container", styles.inner, styles[align]]
    .filter(Boolean)
    .join(" ");

  const overlayClass = [
    styles.overlay,
    strongOverlay ? styles.overlayStrong : "",
  ]
    .filter(Boolean)
    .join(" ");

  const resolvedUrl = typeof image === "string" ? image : image?.url;
  const blur = typeof image === "string" ? undefined : image?.lqip;

  return (
    <section className={rootClass}>
      <div className={styles.media}>
        {resolvedUrl ? (
          <Image
            src={resolvedUrl}
            alt=""
            role="presentation"
            fill
            sizes="100vw"
            priority={priority}
            placeholder={blur ? "blur" : undefined}
            blurDataURL={blur}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className={styles.mediaFallback} />
        )}
        <div className={overlayClass} />
      </div>

      <div className={innerClass}>
        <div className={styles.textBlock}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children && <div className={styles.children}>{children}</div>}
        </div>
      </div>
    </section>
  );
}
