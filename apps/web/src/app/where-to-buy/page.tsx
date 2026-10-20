import type { ReactNode } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import InfoHeader from "@/components/modules/InfoHeader";
import TocLayout from "@/components/modules/Toc/TocLayout";
import type { TocItem } from "@/components/modules/Toc";
import { pageMetadata } from "@/lib/seo";
import styles from "./styles.module.scss";
import { EXTERNAL_REL } from "@/lib/links";

export const metadata = pageMetadata({
  title: "Where to Buy Warhammer 40k Books",
  description:
    "Where to buy Warhammer 40,000 books from Black Library: the Black Library store and app, Warhammer stores, Amazon and Kindle, Audible, other ebook stores, bookshops, libraries, and second-hand.",
  path: "/where-to-buy",
});

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel={EXTERNAL_REL}>
      {children}
    </a>
  );
}

/** Several links in one row, separated by dots */
function linkList(links: ReactNode[]) {
  return links.flatMap((link, i) => (i === 0 ? [link] : [<span key={i} aria-hidden="true"> · </span>, link]));
}

type Store = {
  id: string;
  label: string;
  title: string;
  /** Term / value rows, e.g. Formats and Best for */
  facts: { term: string; value: ReactNode }[];
  body: ReactNode;
};

const STORES: Store[] = [
  {
    id: "warhammer",
    label: "Official store",
    title: "Warhammer",
    facts: [
      { term: "Formats", value: "Print, including limited editions" },
      { term: "Best for", value: "New releases, limited editions, and pre-orders" },
      {
        term: "Pre-orders",
        value: (
          <>
            Usually Saturdays, previewed the Sunday before on{" "}
            <ExternalLink href="https://www.warhammer-community.com">Warhammer Community</ExternalLink>
          </>
        ),
      },
      {
        term: "Visit",
        value: <ExternalLink href="https://www.warhammer.com/en-US/black-library-lp">Black Library on warhammer.com</ExternalLink>,
      },
    ],
    body: (
      <p>
        Games Workshop&apos;s own store, and the official home of Black Library books since{" "}
        <Link href="/blog/black-library-website-closed">the old Black Library webstore closed</Link>. New books
        are listed here first, and it&apos;s the main place for limited and special editions, which often sell
        out on release day and don&apos;t reach other stores.
      </p>
    ),
  },
  {
    id: "black-library-app",
    label: "Official reading app",
    title: "Black Library App",
    facts: [
      { term: "Formats", value: "Ebook and audiobook, on phone and tablet" },
      { term: "Best for", value: "Reading and listening in one place" },
      { term: "Visit", value: <ExternalLink href="https://www.blacklibrary.com">blacklibrary.com</ExternalLink> },
    ],
    body: (
      <p>
        Black Library&apos;s app for reading ebooks and listening to audiobooks on the go. Check the app store
        listing for what&apos;s included and whether it needs a subscription where you live.
      </p>
    ),
  },
  {
    id: "warhammer-stores",
    label: "In person",
    title: "Warhammer Stores",
    facts: [
      { term: "Formats", value: "Print" },
      { term: "Best for", value: "Browsing in person and new releases" },
      {
        term: "Visit",
        value: <ExternalLink href="https://www.warhammer.com/en-US/store-finder">Find a Warhammer store</ExternalLink>,
      },
    ],
    body: (
      <p>
        Warhammer stores and many independent hobby stores keep a shelf of current Black Library books, and
        staff can usually order in what isn&apos;t on it.
      </p>
    ),
  },
  {
    id: "amazon",
    label: "Online retail",
    title: "Amazon & Kindle",
    facts: [
      { term: "Formats", value: "Print and Kindle ebook" },
      { term: "Best for", value: "Paperbacks, Kindle readers, and fast delivery" },
      {
        term: "Visit",
        value: linkList([
          <ExternalLink key="amazon.com" href="https://www.amazon.com/s?k=warhammer+40k+black+library">amazon.com</ExternalLink>,
        ]),
      },
    ],
    body: (
      <p>
        Most of the catalog is on Amazon in paperback and for Kindle. Watch the edition you&apos;re buying:
        listings often mix paperbacks, hardbacks, and omnibuses under one title.
      </p>
    ),
  },
  {
    id: "audible",
    label: "Audio",
    title: "Audible",
    facts: [
      { term: "Formats", value: "Audiobook" },
      { term: "Best for", value: "Listening with an existing Audible membership" },
      {
        term: "Visit",
        value: linkList([
          <ExternalLink key="audible.com" href="https://www.audible.com/search?keywords=warhammer+40k+black+library">audible.com</ExternalLink>,
        ]),
      },
    ],
    body: (
      <p>
        Many Black Library audiobooks are on Audible. Full-cast audio dramas are a different thing from
        read-aloud audiobooks, so check which one a listing is before you buy.
      </p>
    ),
  },
  {
    id: "ebook-stores",
    label: "Digital",
    title: "Other Ebook Stores",
    facts: [
      { term: "Formats", value: "Ebook" },
      {
        term: "Visit",
        value: linkList([
          <ExternalLink key="Kobo" href="https://www.kobo.com/us/en/search?query=warhammer%2040k%20black%20library">Kobo</ExternalLink>,
          <ExternalLink key="Apple Books" href="https://www.apple.com/apple-books/">Apple Books</ExternalLink>,
          <ExternalLink key="Google Play Books" href="https://play.google.com/store/search?q=warhammer%2040k%20black%20library&c=books">Google Play Books</ExternalLink>,
        ]),
      },
    ],
    body: (
      <p>
        If you read on a Kobo or a phone, many titles are also sold through these stores, so you can keep
        your library with the reader you already use.
      </p>
    ),
  },
  {
    id: "bookshops",
    label: "High street",
    title: "Bookshops",
    facts: [
      { term: "Formats", value: "Print" },
      { term: "Best for", value: "Supporting local shops, and ordering by ISBN" },
      {
        term: "Visit",
        value: linkList([
          <ExternalLink key="Bookshop.org" href="https://bookshop.org/search?keywords=warhammer+40k+black+library">Bookshop.org</ExternalLink>,
          <ExternalLink key="Barnes & Noble" href="https://www.barnesandnoble.com/">Barnes & Noble</ExternalLink>,
        ]),
      },
    ],
    body: (
      <p>
        Chains and independent bookshops stock popular series and can order most others. Give them the ISBN
        from the book&apos;s page in the Archive so they order the right edition.
      </p>
    ),
  },
  {
    id: "libraries",
    label: "Free",
    title: "Libraries",
    facts: [
      { term: "Formats", value: "Print, ebook, and audiobook" },
      { term: "Best for", value: "Trying a series before buying it" },
      {
        term: "Visit",
        value: linkList([
          <ExternalLink key="Libby" href="https://libbyapp.com">Libby</ExternalLink>,
        ]),
      },
    ],
    body: (
      <p>
        Public libraries often carry Black Library books, and library apps such as Libby can lend the ebook
        and audiobook editions. If yours doesn&apos;t have a title, ask: many take purchase requests.
      </p>
    ),
  },
  {
    id: "second-hand",
    label: "Out of print",
    title: "Second-Hand",
    facts: [
      { term: "Where", value: "Used bookshops, marketplaces, and fan communities" },
      { term: "Best for", value: "Out-of-print books and older editions" },
      {
        term: "Used books",
        value: linkList([
          <ExternalLink key="AbeBooks" href="https://www.abebooks.com/servlet/SearchResults?kn=warhammer%2040k%20black%20library">AbeBooks</ExternalLink>,
          <ExternalLink key="ThriftBooks" href="https://www.thriftbooks.com/browse/?b.search=warhammer%2040k%20black%20library">ThriftBooks</ExternalLink>,
          <ExternalLink key="Half Price Books" href="https://www.hpb.com/search?q=warhammer%2040k">Half Price Books</ExternalLink>,
          <ExternalLink key="World of Books" href="https://www.wob.com/en-us">World of Books</ExternalLink>,
        ]),
      },
      {
        term: "Marketplaces",
        value: linkList([
          <ExternalLink key="eBay" href="https://www.ebay.com/sch/i.html?_nkw=warhammer+40k+black+library+book">eBay</ExternalLink>,
          <ExternalLink key="Facebook Marketplace" href="https://www.facebook.com/marketplace/">Facebook Marketplace</ExternalLink>,
        ]),
      },
    ],
    body: (
      <>
        <p>
          Older books and sold-out limited editions turn up second-hand. Prices for rare editions climb fast,
          so check whether a newer reprint or omnibus collects the same story first.
        </p>
        <p>
          Fan communities are worth a look too. Facebook has Black Library collector groups, and many let
          members buy, sell, and swap; check each group&apos;s rules first. Reddit&apos;s{" "}
          <ExternalLink href="https://www.reddit.com/r/Blacklibrary/">r/Blacklibrary</ExternalLink> doesn&apos;t
          allow selling, but it&apos;s a good place to ask whether a book has been reprinted or collected.
        </p>
      </>
    ),
  },
];

// the advice first, then one section per store
const SECTIONS: TocItem[] = [
  { id: "tips", label: "Before You Buy" },
  ...STORES.map((s) => ({ id: s.id, label: s.title })),
].map((item, i) => ({ ...item, index: `§ ${toRoman(i + 1)}` }));

function toRoman(n: number) {
  const numerals: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [value, numeral] of numerals) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

function Eyebrow({ id, label }: { id: string; label: string }) {
  const { index } = SECTIONS.find((s) => s.id === id)!;
  return (
    <span className={styles.eyebrow}>
      <span>
        <span className={styles.eyebrowIndex}>{index}</span> · {label}
      </span>
      <span className={styles.indexRule} aria-hidden="true" />
    </span>
  );
}

/** Where to find Black Library books, one card per kind of store */
export default function WhereToBuyPage() {
  return (
    <main>
      <section className="container row__md">
        <TocLayout
          items={SECTIONS}
          header={
            <InfoHeader label="Departmento Munitorum · IA-011 // Supply Lines" title="Where to Buy" />
          }
        >
          <div className={styles.sections}>
            <p className={styles.intro}>
              Black Library books come in print, as ebooks, and as audiobooks, and they&apos;re sold in more places
              than the official store. Here&apos;s where to find them, and what each place is best for.
            </p>

            <Card id="tips" className={styles.anchor} eyebrow={<Eyebrow id="tips" label="Advice" />} title="Before You Buy">
              <ul className={styles.tips}>
                <li>
                  <p>
                    <strong>Limited editions go fast.</strong> New pre-orders, including limited editions, usually go
                    live on <a href="#warhammer">warhammer.com</a> on Saturdays, typically at 1:00 PM Eastern (10:00 AM
                    Pacific), and limited editions often sell out the same day.{" "}
                    <ExternalLink href="https://www.warhammer-community.com">Warhammer Community</ExternalLink> previews
                    each Saturday&apos;s line-up the Sunday before, so check there for what&apos;s coming and when.
                  </p>
                  <p>
                    Local and independent game stores sometimes open their own pre-orders earlier, so it&apos;s worth
                    asking yours.
                  </p>
                </li>
                <li>
                  <strong>Check for an omnibus.</strong> Many series are collected into omnibus editions, which
                  are usually cheaper than buying each book on its own.
                </li>
                <li>
                  <strong>Know the format.</strong> Novels, novellas, short stories, anthologies, and audio
                  dramas can share a title. Each book&apos;s page in the <Link href="/books">catalog</Link> lists
                  its format.
                </li>
              </ul>
            </Card>

            {STORES.map(({ id, label, title, facts, body }) => (
              <Card key={id} id={id} className={styles.anchor} eyebrow={<Eyebrow id={id} label={label} />} title={title}>
                <dl className={styles.readout}>
                  {facts.map(({ term, value }) => (
                    <div key={term}>
                      <dt>{term}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                {body}
              </Card>
            ))}
          </div>
        </TocLayout>
      </section>
    </main>
  );
}
