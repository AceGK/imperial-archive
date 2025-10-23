// /components/modules/AuthorProfile/index.tsx
'use client';

import Image from "next/image";
import { useState } from "react"; //todo maybe move to separate accordion component
import { urlFor } from "@/lib/sanity/sanity.image";
import { PortableText } from "@portabletext/react";
import type { Author40k } from "@/types/sanity";
import type { Book } from "@/lib/40k-books";
import styles from "./styles.module.scss";
import BookCard from "@/components/modules/BookCard";
import Button from "@/components/ui/Button";

import FacebookIcon from "@/components/icons/brands/facebook.svg";
import XIcon from "@/components/icons/brands/x-twitter.svg";
import InstagramIcon from "@/components/icons/brands/instagram.svg";
import BlackLibraryIcon from "@/components/icons/brands/black-library.svg";
import LexicanumIcon from "@/components/icons/brands/lexicanum.svg";
import WikipediaIcon from "@/components/icons/brands/wikipedia.svg";
import WebsiteIcon from "@/components/icons/link.svg";
import ChevronDown from "@/components/icons/chevron-down.svg";

type Props = {
  slug: string;
  profile: Author40k | null;
  authored: Book[];
  makeHref?: (slug: string) => string;
};

const LABELS: Record<string, string> = {
  website: "Official site",
  black_library: "Black Library",
  lexicanum: "Lexicanum",
  wikipedia: "Wikipedia",
  x: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
};

const ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  website: WebsiteIcon,
  black_library: BlackLibraryIcon,
  lexicanum: LexicanumIcon,
  wikipedia: WikipediaIcon,
  x: XIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export default function AuthorProfile({ profile, authored, makeHref }: Props) {
  const visibleLinks = (profile?.links ?? []).filter((l) => !!l?.url);
  const bookCount = authored.length;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.authorProfilePage}>
      <div className={styles.profile}>
        {profile?.image && (
          <div className={styles.imageWrapper}>
            <Image
              className={styles.image}
              src={urlFor(profile.image).width(200).height(200).fit("crop").url()}
              alt={profile.name}
              width={200}
              height={200}
              priority
            />
          </div>
        )}

        <h1 className={styles.name}>{profile?.name}</h1>

        {profile?.bio && (
          <div
            className={`${styles.bio} ${expanded ? styles.expanded : styles.collapsed}`}
          >
            <PortableText value={profile.bio as any} />
          </div>
        )}

        {/* Toggle button appears only if bio is long */}
        {profile?.bio && (
          <Button
            variant="link"
            size="sm"
            className={styles.readMore}
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Show less" : "Read more"}
          >
            {expanded ? "Show less" : "Read more"}
            <ChevronDown className={`${styles.chevron} ${expanded ? styles.expanded : ""}`} />
          </Button>
        )}

        {visibleLinks.length > 0 && (
          <ul className={styles.links}>
            {visibleLinks.map((link) => {
              const Icon = ICONS[link.type];
              const label =
                LABELS[link.type] ??
                link.type.replace(/^\w/, (c) => c.toUpperCase());
              return (
                <li key={`${link.type}-${link.url}`}>
                  <Button
                    href={link.url!}
                    variant="ghost"
                    size="icon"
                    type="button"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                  >
                    <Icon className={styles.icon} aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.books}>
        <h2>
          Books <span style={{ fontSize: "0.85rem" }}>({bookCount})</span>
        </h2>

        {bookCount === 0 ? (
          <p>No books linked yet.</p>
        ) : (
          <div className={styles.bookGrid}>
            {authored.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                href={makeHref ? makeHref(b.slug) : undefined}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
