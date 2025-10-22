"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./styles.module.scss";

export default function Breadcrumb() {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, i, arr) => {
      const href = "/" + arr.slice(0, i + 1).join("/");
      const label = decodeURIComponent(segment.replace(/-/g, " "));
      const isLast = i === arr.length - 1;
      return { href, label, isLast };
    });

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {segments.map((seg) => (
          <li key={seg.href}>
            {seg.isLast ? (
              <span aria-current="page">{seg.label}</span>
            ) : (
              <Link href={seg.href}>{seg.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
