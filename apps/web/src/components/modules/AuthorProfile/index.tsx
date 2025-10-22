import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity/sanity.image";
import { PortableText } from "@portabletext/react";
import type { Author40k } from "@/types/sanity";
import styles from './styles.module.scss';
import BookCard from "@/components/modules/BookCard";

type AuthoredLite = { id: number; title: string; href: string };

const LABELS: Record<string, string> = {
  website: "Official site",
  black_library: "Black Library",
  lexicanum: "Lexicanum",
  wikipedia: "Wikipedia",
  x: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
};

export default function AuthorProfile({
  slug,
  profile,
  authored,
}: {
  slug: string;
  profile: Author40k | null;
  authored: AuthoredLite[];
}) {
  const authorLabel = profile?.name ?? slug;
  const visibleLinks = (profile?.links ?? []).filter((l) => !!l?.url);
  const bookCount = authored.length;

  return (
    <>
      <h1>{authorLabel}</h1>

      {profile?.image ?
          <Image
            className={styles.authorImage}
            src={urlFor(profile.image).width(320).height(320).fit("crop").url()}
            alt={authorLabel}
            width={320}
            height={320}
            priority
          />
       : null}

      {!!visibleLinks.length && (
        <ul
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            padding: 0,
            listStyle: "none",
            margin: "0 0 1rem",
          }}
        >
          {visibleLinks.map((link) => (
            <li key={`${link.type}-${link.url}`}>
              <a href={link.url!} target="_blank" rel="noopener noreferrer">
                {LABELS[link.type] ??
                  link.type.replace(/^\w/, (c) => c.toUpperCase())}{" "}
                ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {profile?.bio && (
        <div style={{ maxWidth: 720, marginBottom: "1.5rem" }}>
          <PortableText value={profile.bio as any} />
        </div>
      )}

      <h2
        style={{
          marginTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        Books <span style={{ fontSize: "0.85rem" }}>({bookCount})</span>
      </h2>

      {bookCount === 0 ? (
        <p>No books linked yet.</p>
      ) : (
        <ul>
          {authored.map((b) => (
            <li key={b.id}>
              <Link href={b.href}>{b.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
