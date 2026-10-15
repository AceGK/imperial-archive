"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { MAX_NAME_LENGTH } from "@convex/readingListLimits";
import { getListBooks, type ListBook } from "@/app/account/reading-lists/actions";
import accountStyles from "@/components/modules/Account/styles.module.scss";
import BookGrid from "@/components/modules/BookGrid";
import { ViewToggle, type CatalogView } from "@/components/modules/Catalog/ViewToggle";
import ArrowLeftIcon from "@/components/icons/arrow-left.svg";
import XmarkIcon from "@/components/icons/xmark.svg";
import Button from "@/components/ui/Button";
import { bookCount, listErrorMessage, thumbUrl, useReadingLists, type ReadingList } from "./useReadingLists";
import styles from "./styles.module.scss";

const VIEW_KEY = "reading-list-view";

/** List (the default, reorderable) or grid, remembered in this browser */
function useListView() {
  const [view, setView] = useState<CatalogView>("list");
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "grid") setView("grid");
    } catch {
      // storage unavailable: stay on list
    }
  }, []);
  const choose = (next: CatalogView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // the choice still applies until the page is left
    }
  };
  return [view, choose] as const;
}

/** /account/reading-lists/[listId]: one list, reorderable by drag or keyboard. */
export default function ReadingListDetail({ listId }: { listId: string }) {
  const { ready, lists, toggleBook, reorder, rename, remove } = useReadingLists();
  const router = useRouter();
  const list = lists.find((l) => l._id === listId);
  const [books, setBooks] = useState<Map<string, ListBook> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useListView();
  const [deleting, setDeleting] = useState(false);

  // refetch card data when the set of books changes, not when they're reordered
  const idsKey = list ? [...list.bookIds].sort().join(",") : undefined;
  useEffect(() => {
    if (idsKey === undefined) return;
    if (!idsKey) {
      setBooks(new Map());
      return;
    }
    let cancelled = false;
    getListBooks(idsKey.split(","))
      .then((docs) => !cancelled && setBooks(new Map(docs.map((d) => [d._id, d]))))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (deleting) return null;

  if (!ready) return <p className={accountStyles.muted}>Loading...</p>;

  if (!list) {
    return (
      <section className={`${accountStyles.card} ${accountStyles.comingSoon}`}>
        <h2>List not found</h2>
        <p className={accountStyles.cardDescription}>It may have been deleted.</p>
        <Button href="/account/reading-lists" variant="tertiary">
          All Reading Lists
        </Button>
      </section>
    );
  }

  // in list order; books deleted from the catalog are skipped
  const shown = books ? list.bookIds.map((id) => books.get(id)).filter((b): b is ListBook => b !== undefined) : [];

  const deleteList = async () => {
    setDeleting(true);
    router.push("/account/reading-lists");
    try {
      await remove({ listId: list._id });
    } catch {
      // the list is still there and shows again on the overview
    }
  };

  return (
    <>
      <Link href="/account/reading-lists" className={styles.back}>
        <ArrowLeftIcon aria-hidden="true" />
        All Reading Lists
      </Link>

      <ListHeader
        list={list}
        onRename={async (name) => {
          await rename({ listId: list._id, name });
        }}
        onDelete={deleteList}
      />

      <div className={styles.toolbar}>
        <span className={accountStyles.muted}>{bookCount(list.bookIds.length)}</span>
        {list.bookIds.length > 1 && view === "list" && (
          <span className={styles.toolbarHint}>Drag the handles to reorder</span>
        )}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {error && (
        <p className={accountStyles.error} role="alert">
          {error}
        </p>
      )}

      {loadError ? (
        <p className={accountStyles.error}>Couldn&apos;t load the books in this list. Please refresh the page.</p>
      ) : books === null ? (
        <p className={accountStyles.muted}>Loading...</p>
      ) : list.bookIds.length === 0 ? (
        <section className={`${accountStyles.card} ${accountStyles.comingSoon}`}>
          <h2>This list is empty</h2>
          <p className={accountStyles.cardDescription}>
            Add books from the Track menu on any book card, or with Add to list on a book&apos;s page.
          </p>
          <Button href="/books" variant="tertiary">
            Browse Books
          </Button>
        </section>
      ) : view === "grid" ? (
        <BookGrid books={shown} />
      ) : (
        <SortableBooks
          list={list}
          books={shown}
          onReorder={(bookIds) => {
            setError(null);
            reorder({ listId: list._id, bookIds }).catch((err) =>
              setError(listErrorMessage(err, "Couldn't save the new order. Try again.")),
            );
          }}
          onRemove={(bookId) => {
            setError(null);
            toggleBook({ listId: list._id, bookId }).catch((err) => setError(listErrorMessage(err)));
          }}
        />
      )}
    </>
  );
}

function ListHeader({
  list,
  onRename,
  onDelete,
}: {
  list: ReadingList;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputId = useId();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onRename(name);
      setEditing(false);
    } catch (err) {
      setError(listErrorMessage(err));
    }
  };

  return (
    <header className={styles.detailHeader}>
      {editing ? (
        <form className={styles.renameForm} onSubmit={save}>
          <label htmlFor={inputId} className={styles.visuallyHidden}>
            List name
          </label>
          <input
            id={inputId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setName(list.name);
                setEditing(false);
              }
            }}
          />
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setName(list.name);
              setEditing(false);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <h1 className={styles.detailTitle}>{list.name}</h1>
      )}

      {!editing && (
        <div className={styles.detailActions}>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Rename
          </Button>
          {confirmDelete ? (
            <>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete list
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button variant="ghost-destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className={accountStyles.error} role="alert">
          {error}
        </p>
      )}
    </header>
  );
}

function SortableBooks({
  list,
  books,
  onReorder,
  onRemove,
}: {
  list: ReadingList;
  books: ListBook[];
  onReorder: (bookIds: string[]) => void;
  onRemove: (bookId: string) => void;
}) {
  const sensors = useSensors(
    // a small movement before a drag starts, so taps and clicks still work
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = books.map((b) => b._id);
  const titleOf = (id: UniqueIdentifier) => books.find((b) => b._id === id)?.title ?? "Book";
  const positionOf = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}, position ${positionOf(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over position ${positionOf(over.id)} of ${ids.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${titleOf(active.id)} dropped at position ${positionOf(over.id)} of ${ids.length}.`
        : `${titleOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. ${titleOf(active.id)} is back at position ${positionOf(active.id)}.`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    // move within the full list, which may include books missing from the catalog
    const from = list.bookIds.indexOf(String(active.id));
    const to = list.bookIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(list.bookIds, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To reorder, press Space or Enter to pick up the book, use the up and down arrow keys to move it, then press Space or Enter again to drop it. Press Escape to cancel.",
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className={styles.rows}>
          {books.map((book, i) => (
            <SortableRow key={book._id} book={book} position={i + 1} onRemove={() => onRemove(book._id)} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ book, position, onRemove }: { book: ListBook; position: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: book._id,
  });
  const link = `/books/${book.slug}`;
  const cover = thumbUrl(book, 120);
  const authors = (book.authors ?? []).filter((a) => a?.name);

  return (
    <li
      ref={setNodeRef}
      className={`${styles.row} ${isDragging ? styles.rowDragging : ""}`}
      style={{
        transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
        transition,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.handle}
        aria-label={`Reorder ${book.title}, position ${position}`}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      <span className={styles.position} aria-hidden="true">
        {position}
      </span>

      <Link href={link} className={styles.rowCover} tabIndex={-1} aria-hidden="true">
        {cover ? (
          <Image src={cover} alt="" fill sizes="56px" unoptimized />
        ) : (
          <span className={styles.coverPlaceholder}>{book.title}</span>
        )}
      </Link>

      <div className={styles.rowDetails}>
        <Link href={link} className={styles.rowTitle}>
          {book.title}
        </Link>
        <span className={styles.rowAuthors}>
          {authors.length === 0 ? "Unknown author" : authors.map((a) => a.name).join(", ")}
        </span>
      </div>

      <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Remove ${book.title} from this list`} title="Remove from list">
        <XmarkIcon aria-hidden="true" />
      </button>
    </li>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {[3, 8, 13].map((y) => (
        <g key={y}>
          <circle cx="5.5" cy={y} r="1.25" />
          <circle cx="10.5" cy={y} r="1.25" />
        </g>
      ))}
    </svg>
  );
}
