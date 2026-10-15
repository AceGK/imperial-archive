'use client';

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import { getFavoriteItems } from "@/app/account/favorites/actions";
import { resolveIcon } from "@/components/icons/factions/resolve";
import XmarkIcon from "@/components/icons/xmark.svg";
import BookGrid from "@/components/modules/BookGrid";
import type { BookCardData } from "@/components/modules/Cards/BookCard";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
import BookRow from "@/components/modules/Cards/BookRow";
import EraCard from "@/components/modules/Cards/EraCard";
import FactionCard from "@/components/modules/Cards/FactionCard";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import rowStyles from "@/components/modules/Cards/ListRow/styles.module.scss";
import { useStoredView } from "@/components/modules/Catalog/ViewToggle";
import Button from "@/components/ui/Button";
import { urlFor } from "@/lib/sanity/sanity.image";
import type { SanityImageField } from "@/types/sanity";
import { LibraryControls, LibraryCount, LibrarySection, matchesQuery, useChipFilter } from "./LibraryControls";
import SectionHeader from "./SectionHeader";
import styles from "./styles.module.scss";
import libraryStyles from "./Library.module.scss";

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

type Kind = FavoriteItem["_type"];
type ItemOf<T extends Kind> = Extract<FavoriteItem, { _type: T }>;

// chip and section order; each favorite has exactly one kind, so the page is
// always grouped and the chips choose which groups show
const KINDS: { key: Kind; label: string }[] = [
  { key: "book40k", label: "Books" },
  { key: "series40k", label: "Series" },
  { key: "author40k", label: "Authors" },
  { key: "faction40k", label: "Factions" },
  { key: "era40k", label: "Eras" },
];

const nameOf = (item: FavoriteItem) => (item._type === "author40k" ? item.name : item.title);

const searchText = (item: FavoriteItem) =>
  item._type === "book40k"
    ? [item.title, ...(item.authors ?? []).map((a) => a?.name ?? "")].join(" ")
    : nameOf(item);

const publications = (n: number) => `${n} ${n === 1 ? "publication" : "publications"}`;

export default function Favorites() {
  const favorites = useQuery(api.favorites.list);
  const [items, setItems] = useState<FavoriteItem[] | null>(null);
  const [error, setError] = useState(false);
  const filter = useChipFilter<Kind>();
  const [query, setQuery] = useState("");
  const [view, setView] = useStoredView("favorites-view", "list");

  // unfavoriting from a row disappears it straight away
  const toggleFavorite = useMutation(api.favorites.toggle).withOptimisticUpdate((store, { itemId }) => {
    const list = store.getQuery(api.favorites.list, {});
    if (list) store.setQuery(api.favorites.list, {}, list.filter((f) => f.itemId !== itemId));
  });

  // Refetch card data whenever the set of favorited ids changes. Search and
  // filters run on this data in the browser.
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

  // while a removal is saving, hide it from the loaded card data too
  const favoritedIds = new Set(favorites?.map((f) => f.itemId));
  const all = (items ?? []).filter((i) => favoritedIds.has(i._id));
  const visible = all.filter(
    (i) => (filter.selected.size === 0 || filter.selected.has(i._type)) && matchesQuery(searchText(i), query),
  );
  const ofType = <T extends Kind>(list: FavoriteItem[], type: T) => list.filter((i): i is ItemOf<T> => i._type === type);
  const unfavorite = (item: FavoriteItem) =>
    toggleFavorite({ kind: kindFor(item._type), itemId: item._id }).catch(() => setError(true));

  return (
    <>
      <SectionHeader title="Favorites" description="The books, authors, and series you love." />

      {error ? (
        <p className={styles.error}>Couldn&apos;t load your favorites. Please refresh the page.</p>
      ) : items === null ? (
        <p className={styles.muted}>Loading...</p>
      ) : all.length === 0 ? (
        <section className={`${styles.card} ${styles.comingSoon}`}>
          <h2>No favorites yet</h2>
          <p className={styles.cardDescription}>
            Tap the Favorite button on any book, series, author, faction, or era to save it here.
          </p>
          <Button href="/books" variant="tertiary">
            Browse Books
          </Button>
        </section>
      ) : (
        <>
          <LibraryControls
            query={query}
            onQueryChange={setQuery}
            searchLabel="Search your favorites by name"
            searchPlaceholder="Search by name"
            total={all.length}
            chips={KINDS.map((k) => ({ key: k.key, label: k.label, count: ofType(all, k.key).length }))}
            selected={filter.selected}
            onToggle={filter.toggle}
            onAll={filter.clear}
            view={view}
            onViewChange={setView}
          />

          <LibraryCount shown={visible.length} total={all.length} noun={["favorite", "favorites"]} />

          {visible.length === 0 ? (
            <section className={`${styles.card} ${styles.comingSoon}`}>
              <h2>No matches</h2>
              <p className={styles.cardDescription}>No favorites match these filters.</p>
              <Button
                variant="tertiary"
                onClick={() => {
                  filter.clear();
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            </section>
          ) : (
            <div className={libraryStyles.sections}>
              {KINDS.map(({ key, label }) => {
                const group = ofType(visible, key);
                if (group.length === 0) return null;
                return (
                  <LibrarySection key={key} title={label} count={group.length}>
                    {view === "grid" ? (
                      <FavoriteGrid items={group} />
                    ) : (
                      <div className={libraryStyles.rows}>
                        {group.map((item) =>
                          item._type === "book40k" ? (
                            <BookRow key={item._id} book={item} />
                          ) : (
                            <FavoriteRow key={item._id} item={item} onRemove={() => unfavorite(item)} />
                          ),
                        )}
                      </div>
                    )}
                  </LibrarySection>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

function kindFor(type: Kind) {
  return ({ book40k: "book", series40k: "series", author40k: "author", faction40k: "faction", era40k: "era" } as const)[type];
}

/** One kind's favorites as the catalog's cards */
function FavoriteGrid({ items }: { items: FavoriteItem[] }) {
  if (items[0]?._type === "book40k") {
    return <BookGrid books={items as ItemOf<"book40k">[]} />;
  }
  return (
    <div className={styles.favoriteGrid}>
      {items.map((item) => {
        switch (item._type) {
          case "series40k":
            return (
              <SeriesCard
                key={item._id}
                title={item.title}
                slug={item.slug}
                image={item.image}
                compact
                countLabel={`${item.totalCount} ${item.totalCount === 1 ? "Publication" : "Publications"}`}
              />
            );
          case "author40k":
            return <AuthorCard key={item._id} name={item.name} slug={item.slug} count={item.count} image={item.image} />;
          case "faction40k":
            return <FactionCard key={item._id} title={item.title} slug={item.slug} group={item.groupKey} iconId={item.iconId} />;
          case "era40k":
            return (
              <EraCard key={item._id} title={item.title} slug={item.slug} period={item.period} image={item.image} compact />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

/**
 * A series, author, faction or era in the list view: [thumbnail] [name, detail] ..... [remove].
 * Books use the catalog's BookRow instead, with its Track menu.
 */
function FavoriteRow({ item, onRemove }: { item: Exclude<FavoriteItem, { _type: "book40k" }>; onRemove: () => void }) {
  const name = nameOf(item);
  const { href, detail, thumb } = (() => {
    switch (item._type) {
      case "series40k":
        return {
          href: `/series/${item.slug}`,
          detail: publications(item.totalCount),
          thumb: item.image?.asset ? (
            <span className={`${rowStyles.thumb} ${rowStyles.thumbSeries}`}>
              <Image
                src={urlFor(item.image).width(256).height(144).fit("crop").auto("format").url()}
                alt=""
                fill
                sizes="128px"
                unoptimized
              />
            </span>
          ) : (
            <span className={`${rowStyles.thumb} ${rowStyles.thumbSeries}`}>
              <span className={rowStyles.placeholder}>{name}</span>
            </span>
          ),
        };
      case "author40k":
        return {
          href: `/authors/${item.slug}`,
          detail: publications(item.count),
          thumb: (
            <span className={`${rowStyles.thumb} ${rowStyles.thumbAuthor}`}>
              {item.image?.asset ? (
                <Image
                  src={urlFor(item.image).width(128).height(128).fit("crop").auto("format").url()}
                  alt=""
                  fill
                  sizes="64px"
                  unoptimized
                />
              ) : (
                initialsOf(name)
              )}
            </span>
          ),
        };
      case "faction40k": {
        const Icon = resolveIcon(item.iconId || item.slug);
        return {
          href: item.groupKey ? `/factions/${item.groupKey}/${item.slug}` : `/factions/${item.slug}`,
          detail: "Faction",
          thumb: (
            <span className={`${rowStyles.thumb} ${libraryStyles.thumbIcon}`}>
              {Icon && <Icon width={32} height={32} aria-hidden />}
            </span>
          ),
        };
      }
      case "era40k":
        return {
          href: `/eras/${item.slug}`,
          detail: item.period || "Era",
          thumb: (
            <span className={`${rowStyles.thumb} ${rowStyles.thumbSeries}`}>
              {item.image?.url ? (
                <Image src={`${item.image.url}?w=256&h=144&fit=crop&auto=format`} alt="" fill sizes="128px" unoptimized />
              ) : (
                <span className={rowStyles.placeholder}>{name}</span>
              )}
            </span>
          ),
        };
    }
  })();

  return (
    <article className={rowStyles.row}>
      <Link href={href} aria-hidden="true" tabIndex={-1} className={libraryStyles.thumbLink}>
        {thumb}
      </Link>
      <div className={rowStyles.details}>
        <Link href={href} className={rowStyles.title}>
          {name}
        </Link>
        <div className={rowStyles.byline}>{detail}</div>
      </div>
      <div className={rowStyles.actions}>
        <button
          type="button"
          className={libraryStyles.remove}
          onClick={onRemove}
          aria-label={`Remove ${name} from favorites`}
          title="Remove from favorites"
        >
          <XmarkIcon aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

// "Dan Abnett" -> "DA", shown when an author has no photo
function initialsOf(name: string) {
  return name
    .replace(/[.’']/g, " ")
    .split(/[\s-]+/)
    .map((part) => part.match(/\p{L}/u)?.[0] ?? "")
    .join("")
    .toUpperCase();
}
