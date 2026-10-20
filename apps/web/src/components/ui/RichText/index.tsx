import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { urlFor } from "@/lib/sanity/sanity.image";
import { PortableText, type PortableTextBlockComponent, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { SITE_URL } from "@/lib/seo";
import HeadingAnchor from "@/components/ui/HeadingAnchor";
import { EXTERNAL_REL } from "@/lib/links";
import { ArchiveLink, BookShelf, SeriesShelf } from "./embeds";

/**
 * Site-wide link rule:
 * - links to this site (a path like /support, an #anchor, or a full
 *   https://imperialarchive.com/... URL) stay in the same tab and use
 *   client-side navigation
 * - links to other sites always open in a new tab
 */
export function SmartLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const internal = href.startsWith(SITE_URL) ? href.slice(SITE_URL.length) || "/" : href;

  if (internal.startsWith("/") || internal.startsWith("#")) {
    return (
      <Link href={internal} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} target="_blank" rel={EXTERNAL_REL}>
      {children}
    </a>
  );
}

// Sanity image refs carry the original size: "image-<id>-<width>x<height>-<ext>"
function imageSize(ref: string | undefined) {
  const match = ref?.match(/-(\d+)x(\d+)-[a-z]+$/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

const blockComponents: Record<string, PortableTextBlockComponent> = {
  // the page title is the only h1; an "H1" inside content renders one level down
  h1: ({ children }) => <h2>{children}</h2>,
};

export const richTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => <SmartLink href={value?.href ?? ""}>{children}</SmartLink>,
    internalLink: ({ value, children }) => <ArchiveLink value={value}>{children}</ArchiveLink>,
  },
  block: blockComponents,
  types: {
    bookShelf: ({ value }) => <BookShelf value={value} />,
    seriesShelf: ({ value }) => <SeriesShelf value={value} />,
    image: ({ value }) => {
      const size = imageSize(value?.asset?._ref);
      if (!value?.asset || !size) return null;
      const width = Math.min(size.width, 1200);
      return (
        <figure className="rich-text-figure">
          <Image
            src={urlFor(value).width(width).auto("format").url()}
            alt={value.alt || ""}
            width={width}
            height={Math.round((size.height / size.width) * width)}
            sizes="(max-width: 800px) 100vw, 760px"
          />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      );
    },
  },
};

function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  if (!id) return <h2>{children}</h2>;
  return (
    <h2 id={id}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h2>
  );
}

/**
 * Renders Portable Text from Sanity with the site's shared link handling.
 * `headingIds` maps a heading block's `_key` to the anchor id it should get.
 * `endOfText` is placed at the end of the last paragraph, e.g. source citations.
 */
export default function RichText({
  value,
  headingIds,
  endOfText,
}: {
  value: PortableTextBlock[] | undefined | null;
  headingIds?: Record<string, string>;
  endOfText?: ReactNode;
}) {
  if (!value?.length) return null;

  const lastParagraph = endOfText
    ? value.findLast((b) => b._type === "block" && (b.style ?? "normal") === "normal" && !b.listItem)?._key
    : undefined;

  const components: PortableTextComponents = {
    ...richTextComponents,
    block: {
      ...blockComponents,
      // section headings the contents rail links to, each with a copy-link button
      ...(headingIds && {
        h1: ({ value, children }) => <SectionHeading id={headingIds[value._key ?? ""]}>{children}</SectionHeading>,
        h2: ({ value, children }) => <SectionHeading id={headingIds[value._key ?? ""]}>{children}</SectionHeading>,
      }),
      ...(lastParagraph && {
        normal: ({ value, children }) => (
          <p>
            {children}
            {value._key === lastParagraph && endOfText}
          </p>
        ),
      }),
    },
  };

  return <PortableText value={value} components={components} />;
}
