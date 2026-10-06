"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import HeartIcon from "@/components/icons/account/favorites.svg";
import styles from "./styles.module.scss";

type FavoriteKind = "book" | "series" | "author" | "faction" | "era";

type FavoriteButtonProps = {
  kind: FavoriteKind;
  /** Sanity document _id */
  itemId: string;
  /** "overlay" for placement on top of hero images */
  variant?: "default" | "overlay";
  className?: string;
};

/** Heart toggle for saving catalog items. Signed-out visitors are sent to /login. */
export default function FavoriteButton({
  kind,
  itemId,
  variant = "default",
  className,
}: FavoriteButtonProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const isFavorite = useQuery(api.favorites.isFavorite, isAuthenticated ? { itemId } : "skip");
  const toggle = useMutation(api.favorites.toggle).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.favorites.isFavorite, { itemId: args.itemId });
    store.setQuery(api.favorites.isFavorite, { itemId: args.itemId }, !current);
  });
  const router = useRouter();
  const [error, setError] = useState(false);

  const active = isAuthenticated && isFavorite === true;

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setError(false);
    try {
      await toggle({ kind, itemId });
    } catch {
      setError(true);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${variant === "overlay" ? styles.overlay : ""} ${active ? styles.active : ""} ${className ?? ""}`}
      onClick={handleClick}
      disabled={isLoading || (isAuthenticated && isFavorite === undefined)}
      aria-pressed={active}
      title={error ? "Couldn't save. Try again." : undefined}
    >
      <HeartIcon className={styles.icon} aria-hidden="true" />
      <span>{active ? "Favorited" : "Favorite"}</span>
    </button>
  );
}
