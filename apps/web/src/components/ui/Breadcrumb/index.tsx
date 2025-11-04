"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import ChevronLeft from "@/components/icons/chevron-left.svg";
import ChevronRight from "@/components/icons/chevron-right.svg"; // <- add this
import styles from "./styles.module.scss";

const PARENT_LABELS: Record<string, string> = {
  factions: "Factions",
  authors: "Authors",
  series: "Series",
  eras: "Eras",
  blog: "Posts",
};

const toTitle = (s: string) =>
  decodeURIComponent(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Breadcrumb() {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length >= 3) {
    const items = segments.map((segment, i, arr) => {
      const href = "/" + arr.slice(0, i + 1).join("/");
      const label = toTitle(segment);
      const isLast = i === arr.length - 1;
      return { href, label, isLast };
    });

    return (
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <ol className={styles.list}>
          {/* Home */}
          <li className={styles.item}>
            <Link href="/">Home</Link>
            <ChevronRight className={styles.icon} />
          </li>

          {/* Dynamic segments */}
          {items.map((seg) => (
            <li key={seg.href} className={styles.item}>
              {seg.isLast ? (
                <span aria-current="page">{seg.label}</span>
              ) : (
                <>
                  <Link href={seg.href}>{seg.label}</Link>
                  <ChevronRight className={styles.icon} />
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  if (segments.length === 2) {
    const parent = segments[0];
    const parentHref = `/${parent}`;
    const parentLabel = PARENT_LABELS[parent] ?? toTitle(parent);

    return (
      <div className={styles.breadcrumbBack}>
        <Button href={parentHref} variant="link">
          <ChevronLeft aria-hidden="true" />
          {`All ${parentLabel}`}
        </Button>
      </div>
    );
  }

  return null;
}
