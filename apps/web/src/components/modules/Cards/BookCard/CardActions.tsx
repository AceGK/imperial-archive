"use client";

import { useState } from "react";
import CardTags from "./CardTags";
import TrackMenu from "./TrackMenu";
import styles from "./styles.module.scss";

/**
 * A grid card cover's reading state: tags in its top corners, and a "Track"
 * button along the bottom that appears on hover and stays while its menu is open.
 */
export default function CardActions({
  bookId,
  title,
  showTags = true,
}: {
  bookId: string;
  title: string;
  /** The reader can hide the tags (catalog Display menu); the Track button always stays */
  showTags?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {showTags && <CardTags bookId={bookId} />}
      <div className={`${styles.actions} ${menuOpen ? styles.actionsOpen : ""}`}>
        <TrackMenu bookId={bookId} title={title} onOpenChange={setMenuOpen} />
      </div>
    </>
  );
}
