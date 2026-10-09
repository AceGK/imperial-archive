import Link from "next/link";
import type { ReactNode } from "react";
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

export const richTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => <SmartLink href={value?.href ?? ""}>{children}</SmartLink>,
  },
};

/** Renders Portable Text from Sanity with the site's shared link handling */
export default function RichText({ value }: { value: PortableTextBlock[] | undefined | null }) {
  if (!value?.length) return null;
  return <PortableText value={value} components={richTextComponents} />;
}
