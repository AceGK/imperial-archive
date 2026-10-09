import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { urlFor } from "@/lib/sanity/sanity.image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { SITE_URL } from "@/lib/seo";

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
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// Sanity image refs carry the original size: "image-<id>-<width>x<height>-<ext>"
function imageSize(ref: string | undefined) {
  const match = ref?.match(/-(\d+)x(\d+)-[a-z]+$/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

export const richTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => <SmartLink href={value?.href ?? ""}>{children}</SmartLink>,
  },
  block: {
    // the page title is the only h1; an "H1" inside content renders one level down
    h1: ({ children }) => <h2>{children}</h2>,
  },
  types: {
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

/**
 * Renders Portable Text from Sanity with the site's shared link handling.
 * `headingIds` maps a heading block's `_key` to the anchor id it should get.
 */
export default function RichText({
  value,
  headingIds,
}: {
  value: PortableTextBlock[] | undefined | null;
  headingIds?: Record<string, string>;
}) {
  if (!value?.length) return null;

  const components: PortableTextComponents = headingIds
    ? {
        ...richTextComponents,
        block: {
          h1: ({ value, children }) => <h2 id={headingIds[value._key ?? ""]}>{children}</h2>,
          h2: ({ value, children }) => <h2 id={headingIds[value._key ?? ""]}>{children}</h2>,
        },
      }
    : richTextComponents;

  return <PortableText value={value} components={components} />;
}
