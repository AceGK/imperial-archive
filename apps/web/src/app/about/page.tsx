import { pageMetadata } from "@/lib/seo";
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TocLayout from "@/components/modules/Toc/TocLayout";
import type { TocItem } from "@/components/modules/Toc";
import styles from "./styles.module.scss";
import InfoHeader from "@/components/modules/InfoHeader";

export const metadata = pageMetadata({
  title: "About",
  description:
    "About Imperial Archive: a fan-made catalog and reading tracker for Warhammer 40,000 fiction from Black Library, where the data comes from, and how it's built.",
  path: "/about",
});

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const BlackLibrary = () => (
  <ExternalLink href="https://www.blacklibrary.com">Black Library</ExternalLink>
);
const GamesWorkshop = () => (
  <ExternalLink href="https://www.games-workshop.com">
    Games Workshop
  </ExternalLink>
);
const Lexicanum = () => (
  <ExternalLink href="https://wh40k.lexicanum.com">Lexicanum</ExternalLink>
);

const SECTIONS: TocItem[] = [
  { id: "charter", index: "§ I", label: "Charter" },
  { id: "archivist", index: "§ II", label: "Archivist" },
  // { id: "content", index: "§ III", label: "Data-Vault" },
  { id: "machine-spirit", index: "§ III", label: "Machine Spirit" },
  { id: "attribution", index: "§ IV", label: "Attribution" },
  { id: "vox", index: "§ V", label: "Vox" },
  { id: "tithe", index: "§ VI", label: "Tithe" },
];

/*
 * Data-Vault section (disabled for now). To turn it on:
 * 1. check each source below is accurate
 * 2. uncomment the "content" entry in SECTIONS above and renumber the
 *    sections after it (§ IV Machine Spirit, § V Attribution, ...)
 * 3. uncomment CONTENT_SOURCES and the Data-Vault card in the page below
 */
// const CONTENT_SOURCES: { term: string; source: ReactNode }[] = [
//   { term: "Synopses & back-cover text", source: <BlackLibrary /> },
//   { term: "Formats, release dates & page counts", source: "Black Library listings and published editions" },
//   { term: "Editions & ISBNs", source: "Published print, digital, and audio editions" },
//   { term: "Factions, eras & series placement", source: <>Compiled by hand, cross-referenced with <Lexicanum /></> },
//   { term: "Further reading", source: "Links out to Black Library, Lexicanum, Goodreads, and Amazon where available" },
// ];

const STACK = [
  {
    name: "Next.js",
    href: "https://nextjs.org",
    role: "The front end, rendered with React and TypeScript",
  },
  {
    name: "Sanity",
    href: "https://www.sanity.io",
    role: "The data-vault where every record is kept",
  },
  {
    name: "Algolia",
    href: "https://www.algolia.com",
    role: "Search and filtering across the catalog",
  },
  {
    name: "Convex",
    href: "https://www.convex.dev",
    role: "Accounts, sign-in, reading tracker, and reading lists",
  },
  {
    name: "Swiper.js",
    href: "https://swiperjs.com",
    role: "The carousels for books, authors, series, and factions",
  },
  {
    name: "Vercel",
    href: "https://vercel.com",
    role: "Hosting, deployment, and performance monitoring",
  },
];

const CREDITS: { label: string; body: ReactNode }[] = [
  {
    label: "Cover art & publication data",
    body: (
      <>
        Book cover artwork and publication data are sourced from{" "}
        <BlackLibrary /> and <GamesWorkshop /> and remain their property.
      </>
    ),
  },
  {
    label: "Descriptions & synopses",
    body: (
      <>
        Quoted from their publishers and other sources, including{" "}
        <BlackLibrary /> book covers and listings, <Lexicanum />, and retailers
        such as Amazon. They remain the work of their respective authors and
        publishers.
      </>
    ),
  },
  {
    label: "Faction & achievement icons",
    body: (
      <>
        Drawn from{" "}
        <ExternalLink href="https://github.com/Certseeds/wh40k-icon">
          wh40k-icon
        </ExternalLink>
        , an open-source collection by Certseeds and its contributors, shared
        under{" "}
        <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
          CC BY-NC-SA 4.0
        </ExternalLink>
        . Where a faction had no icon there, one was hand-crafted for the
        Archive. The symbols themselves belong to <GamesWorkshop />.
      </>
    ),
  },
  {
    label: "Banner artwork",
    body: (
      <>
        Where the artist behind a banner image is known, their credit is
        inscribed in the bottom-right corner of that image. Consult it there for
        provenance.
      </>
    ),
  },
  {
    label: "Lore",
    body: (
      <>
        Where available, books, authors, series, and factions link out to their{" "}
        <Lexicanum /> entry, a community-maintained Warhammer 40,000 wiki, for
        deeper lore beyond what is catalogued here.
      </>
    ),
  },
];

function ComingSoon() {
  return <span className={styles.badge}>Coming soon</span>;
}

function Eyebrow({ id }: { id: string }) {
  const { index, label } = SECTIONS.find((s) => s.id === id)!;
  return (
    <span className={styles.eyebrow}>
      <span>
        <span className={styles.eyebrowIndex}>{index}</span> · {label}
      </span>
      <span className={styles.indexRule} aria-hidden="true" />
    </span>
  );
}

export default function AboutPage() {
  return (
    <main>
      <section className="container row__md">
        <TocLayout
          items={SECTIONS}
          header={
            <InfoHeader
              label="Adeptus Administratum · IA-001 // Dossier"
              title="About the Imperial Archive"
            />
          }
        >
          <div className={styles.sections}>
            <Card
              id="charter"
              className={styles.anchor}
              eyebrow={<Eyebrow id="charter" />}
              title="The Archive"
            >
              <p>
                The Imperial Archive is a catalog of Warhammer 40,000 fiction
                from the <BlackLibrary /> — novels, novellas, short stories,
                anthologies, and audio dramas, organized by author, series,
                faction, and era.
              </p>
              <p>
                It exists for readers who want to see the shape of the whole
                library at a glance: what connects to what, which order to read
                a series in, and what to pick up next.
              </p>
              <p>
                This is an unofficial, fan-made resource and is not affiliated
                with <GamesWorkshop />. All Warhammer 40,000® logos, names, and
                images are the property of <GamesWorkshop /> Limited.
              </p>
            </Card>

            <Card
              id="archivist"
              className={styles.anchor}
              eyebrow={<Eyebrow id="archivist" />}
              title="The Creator"
            >
              <p>
                The Imperial Archive is built and maintained by a single
                developer and longtime reader of the Black Library, with more
                than ten years of experience as a full-stack web developer.
              </p>
              <blockquote className={styles.quote}>
                <p>
                  Like many who wander into the grim darkness of the far future,
                  I started with one book and soon found myself lost in a
                  library spanning thousands of stories, dozens of series, and
                  over ten thousand years of lore. The Archive is the guide I
                  wished I&apos;d had when I started.
                </p>
              </blockquote>
              <p>
                This is a side project, built as a resource for the community.
                The official Black Library website doesn&apos;t list every
                publication, and detailed book information can be hard to find,
                so the Archive aims to gather it all in one place. It&apos;s
                still incomplete and very much a work in progress, with new
                books, details, and features added over time.
              </p>
            </Card>

            <Card
              id="machine-spirit"
              className={styles.anchor}
              eyebrow={<Eyebrow id="machine-spirit" />}
              title="Built With"
            >
              <p>
                The Archive&apos;s machine spirit is bound together from the
                following technologies:
              </p>
              <dl className={styles.readout}>
                {STACK.map(({ name, href, role }) => (
                  <div key={name}>
                    <dt>
                      <ExternalLink href={href}>{name}</ExternalLink>
                    </dt>
                    <dd>{role}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card
              id="attribution"
              className={styles.anchor}
              eyebrow={<Eyebrow id="attribution" />}
              title="Credits & Sources"
            >
              <dl className={styles.credits}>
                {CREDITS.map(({ label, body }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{body}</dd>
                  </div>
                ))}
              </dl>
              <p>
                In a library this vast, gaps and errors are inevitable. Once the
                vox-channel below is open, reports of missing or incorrect
                records are welcome.
              </p>
              {/* <div className={styles.upcoming}>
                <ComingSoon />
                <p>
                  <strong>Moderator support.</strong> Trusted readers will
                  soon be able to join the Archive&apos;s scribes, helping to
                  add, correct, and maintain records across the catalog.
                </p>
              </div> */}
            </Card>

            <div className={styles.linkGrid}>
              <Card
                id="vox"
                className={styles.anchor}
                eyebrow={<Eyebrow id="vox" />}
                title="Contact"
              >
                <ComingSoon />
                <p>
                  The Archive&apos;s vox-channel is still being consecrated. A
                  contact form will open soon for corrections, missing records,
                  suggestions, or simply to hail the Archivist.
                </p>
              </Card>

              <Card
                id="tithe"
                className={styles.anchor}
                eyebrow={<Eyebrow id="tithe" />}
                title="Support"
              >
                <p style={{ marginBottom: "0.5rem" }}>
                  The Archive is free and ad-free. If it&apos;s helped you, a
                  tithe toward hosting and upkeep keeps the cogitators running.
                </p>

                <Button href="/support" variant="secondary" size="sm">
                  Offer a Tithe
                </Button>
              </Card>
            </div>
          </div>
        </TocLayout>
      </section>
    </main>
  );
}
