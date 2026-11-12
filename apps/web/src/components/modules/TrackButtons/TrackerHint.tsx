"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import styles from "./styles.module.scss";

/**
 * A line under a book's track buttons for signed-out visitors, linking to the
 * reading tracker guide. Every book page links to /track this way, which also
 * tells search engines what that page is about.
 */
export default function TrackerHint() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading || isAuthenticated) return null;

  return (
    <p className={styles.hint}>
      Sign in to track this book in your free <Link href="/track">reading tracker</Link>.
    </p>
  );
}
