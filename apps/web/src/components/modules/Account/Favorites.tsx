'use client';

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import { getFavoriteItems } from "@/app/account/favorites/actions";
import BookGrid from "@/components/modules/BookGrid";
import type { BookCardData } from "@/components/modules/Cards/BookCard";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
import EraCard from "@/components/modules/Cards/EraCard";
import FactionCard from "@/components/modules/Cards/FactionCard";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import Button from "@/components/ui/Button";
import type { SanityImageField } from "@/types/sanity";
import SectionHeader from "./SectionHeader";
import styles from "./styles.module.scss";

export type FavoriteItem =
  | ({ _type: "book40k" } & BookCardData & { _id: string })
  | {
      _type: "series40k";
      _id: string;
      title: string;
      slug: string;
      image?: SanityImageField | null;
      totalCount: number;
    }
  | {
      _type: "author40k";
      _id: string;
      name: string;
      slug: string;
      image?: React.ComponentProps<typeof AuthorCard>["image"];
      count: number;
    }
  | { _type: "faction40k"; _id: string; title: string; slug: string; iconId?: string; groupKey?: string }
  | {
      _type: "era40k";
      _id: string;
      title: string;
      slug: string;
      period?: string;
      description?: string;
      image?: { url: string; lqip?: string; alt?: string };
    };

type ItemOf<T extends FavoriteItem["_type"]> = Extract<FavoriteItem, { _type: T }>;

export default function Favorites() {
  const favorites = useQuery(api.favorites.list);
  const [items, setItems] = useState<FavoriteItem[] | null>(null);
  const [error, setError] = useState(false);

  // Refetch card data whenever the set of favorited ids changes
  const idsKey = favorites?.map((f) => f.itemId).join(",");
  useEffect(() => {
    if (idsKey === undefined) return;
    const ids = idsKey ? idsKey.split(",") : [];
    let cancelled = false;
    getFavoriteItems(ids)
      .then((docs) => {
        if (cancelled) return;
        // Keep newest-first order from Convex
        const byId = new Map(docs.map((d) => [d._id, d]));
        setItems(ids.map((id) => byId.get(id)).filter((d): d is FavoriteItem => d !== undefined));
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const ofType = <T extends FavoriteItem["_type"]>(type: T) =>
    (items ?? []).filter((i): i is ItemOf<T> => i._type === type);

  const books = ofType("book40k");
  const series = ofType("series40k");
  const authors = ofType("author40k");
  const factions = ofType("faction40k");
  const eras = ofType("era40k");

  return (
    <>
      <SectionHeader title="Favorites" description="The books, authors, and series you love." />

      {error ? (
        <p className={styles.error}>Couldn&apos;t load your favorites. Please refresh the page.</p>
      ) : items === null ? (
        <p className={styles.muted}>Loading...</p>
      ) : items.length === 0 ? (
        <section className={`${styles.card} ${styles.comingSoon}`}>
          <h2>No favorites yet</h2>
          <p className={styles.cardDescription}>
            Tap the Favorite button on any book, series, author, faction, or era to save it here.
          </p>
          <Button href="/books" variant="secondary">
            Browse Books
          </Button>
        </section>
      ) : (
        <>
          {books.length > 0 && (
            <FavoriteSection title="Books" count={books.length}>
              <BookGrid books={books} />
            </FavoriteSection>
          )}
          {series.length > 0 && (
            <FavoriteSection title="Series" count={series.length}>
              <div className={styles.favoriteGrid}>
                {series.map((s) => (
                  <SeriesCard
                    key={s._id}
                    title={s.title}
                    slug={s.slug}
                    image={s.image}
                    compact
                    countLabel={`${s.totalCount} ${s.totalCount === 1 ? "Work" : "Works"}`}
                  />
                ))}
              </div>
            </FavoriteSection>
          )}
          {authors.length > 0 && (
            <FavoriteSection title="Authors" count={authors.length}>
              <div className={styles.favoriteGrid}>
                {authors.map((a) => (
                  <AuthorCard key={a._id} name={a.name} slug={a.slug} count={a.count} image={a.image} />
                ))}
              </div>
            </FavoriteSection>
          )}
          {factions.length > 0 && (
            <FavoriteSection title="Factions" count={factions.length}>
              <div className={styles.favoriteGrid}>
                {factions.map((f) => (
                  <FactionCard key={f._id} title={f.title} slug={f.slug} group={f.groupKey} iconId={f.iconId} />
                ))}
              </div>
            </FavoriteSection>
          )}
          {eras.length > 0 && (
            <FavoriteSection title="Eras" count={eras.length}>
              <div className={styles.favoriteGrid}>
                {eras.map((e) => (
                  <EraCard
                    key={e._id}
                    title={e.title}
                    slug={e.slug}
                    period={e.period}
                    image={e.image}
                    compact
                  />
                ))}
              </div>
            </FavoriteSection>
          )}
        </>
      )}
    </>
  );
}

function FavoriteSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.favoriteSection}>
      <h2>
        {title} <span className={styles.muted}>({count})</span>
      </h2>
      {children}
    </section>
  );
}
