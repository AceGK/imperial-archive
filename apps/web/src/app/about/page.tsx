import type { Metadata } from "next";
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import Toc, { type TocItem } from "./Toc";
import styles from "./styles.module.scss";

export const metadata: Metadata = {
  title: "About | Imperial Archive",
  description:
    "About Imperial Archive — a fan-made catalog of Warhammer 40,000 fiction from Black Library.",
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
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
  <ExternalLink href="https://www.games-workshop.com">Games Workshop</ExternalLink>
);
const Lexicanum = () => (
  <ExternalLink href="https://wh40k.lexicanum.com">Lexicanum</ExternalLink>
);

const SECTIONS: TocItem[] = [
  { id: "charter", index: "§ I", label: "Charter" },
  { id: "archivist", index: "§ II", label: "Archivist" },
  { id: "content", index: "§ III", label: "Data-Vault" },
  { id: "machine-spirit", index: "§ IV", label: "Machine Spirit" },
  { id: "attribution", index: "§ V", label: "Attribution" },
  { id: "vox", index: "§ VI", label: "Vox" },
  { id: "tithe", index: "§ VII", label: "Tithe" },
];

const CONTENT_SOURCES: { term: string; source: ReactNode }[] = [
  { term: "Synopses & back-cover text", source: <BlackLibrary /> },
  { term: "Formats, release dates & page counts", source: "Black Library listings and published editions" },
  { term: "Editions & ISBNs", source: "Published print, digital, and audio editions" },
  { term: "Factions, eras & series placement", source: <>Compiled by hand, cross-referenced with <Lexicanum /></> },
  { term: "Further reading", source: "Links out to Black Library, Lexicanum, Goodreads, and Amazon where available" },
];

const STACK = [
  { name: "Next.js", href: "https://nextjs.org", role: "The front end, rendered with React and TypeScript" },
  { name: "Sanity", href: "https://www.sanity.io", role: "The data-vault where every record is kept" },
  { name: "Algolia", href: "https://www.algolia.com", role: "Search and filtering across the catalog" },
  { name: "Convex", href: "https://www.convex.dev", role: "Accounts, sign-in, and reader data" },
  { name: "Swiper", href: "https://swiperjs.com", role: "The carousels for books, authors, series, and factions" },
  { name: "Vercel", href: "https://vercel.com", role: "Hosting and deployment" },
];

function ComingSoon() {
  return (
    <span className={styles.badge}>Coming soon</span>
  );
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
      <section className="container row__lg">
        <div className={styles.layout}>
          <aside className={styles.aside}>
            <Toc items={SECTIONS} />
          </aside>

          <div className={styles.content}>
            <header className={styles.header}>
              <div className={styles.ref}>Adeptus Administratum · IA-001 // Dossier</div>
              <h1 className={styles.title}>About this project</h1>
              <div className={styles.divider} />
            </header>

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
                  library at a glance: what connects to what, which order to
                  read a series in, and what to pick up next.
                </p>
                <p>
                  This is an unofficial, fan-made resource and is not
                  affiliated with <GamesWorkshop />. All Warhammer 40,000® logos,
                  names, and images are the property of <GamesWorkshop /> Limited.
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
                  developer and longtime reader of the <BlackLibrary />. Like
                  many who wander into the grim darkness of the far future, I
                  started with one book and soon found myself lost in a library
                  spanning thousands of stories, dozens of series, and ten
                  thousand years of lore.
                </p>
                <p>
                  This is a passion side project, built as a resource for the
                  community. The official Black Library website doesn&apos;t
                  list every publication, and detailed book information can be
                  hard to find, so the Archive aims to gather it all in one
                  place. It&apos;s still incomplete and very much a work in
                  progress, with new books, details, and features added over
                  time.
                </p>
              </Card>

              <Card
                id="content"
                className={styles.anchor}
                eyebrow={<Eyebrow id="content" />}
                title="Content & Sources"
              >
                <p>
                  Every record in the Archive is compiled from the books as
                  published. Synopses and back-cover text are drawn from
                  official <BlackLibrary /> listings, so each entry reads as
                  the publisher intended, and lore context is cross-referenced
                  against <Lexicanum />.
                </p>
                <dl className={styles.readout}>
                  {CONTENT_SOURCES.map(({ term, source }) => (
                    <div key={term}>
                      <dt>{term}</dt>
                      <dd>{source}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  Records are compiled and checked by hand, and in a library
                  this vast, gaps and errors are inevitable. Once the vox-channel
                  below is open, reports of missing or incorrect records are
                  welcome.
                </p>
                <div className={styles.upcoming}>
                  <ComingSoon />
                  <p>
                    <strong>Moderator support.</strong> Trusted readers will
                    soon be able to join the Archive&apos;s scribes, helping to
                    add, correct, and maintain records across the catalog.
                  </p>
                </div>
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
                title="Credits & Inspiration"
              >
                <p>
                  Book cover artwork and publication data are sourced from{" "}
                  <BlackLibrary /> and <GamesWorkshop /> and remain their
                  property.
                </p>
                <p>
                  Where the artist behind a page banner is known — the
                  imagery atop the Books, Authors, Series, Factions, and Eras
                  pages — their attribution is inscribed in the bottom-right
                  corner of that banner. Consult it there for provenance.
                </p>
                <p>
                  Where available, books, authors, series, and factions link
                  out to their corresponding <Lexicanum /> entry — a
                  community-maintained Warhammer 40,000 wiki — for deeper lore
                  beyond what is catalogued here.
                </p>
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
                    The Archive&apos;s vox-channel is still being consecrated.
                    A contact form will open soon for corrections, missing
                    records, suggestions, or simply to hail the Archivist.
                  </p>
                </Card>

                <Card
                  id="tithe"
                  className={styles.anchor}
                  eyebrow={<Eyebrow id="tithe" />}
                  title="Support"
                >
                  <ComingSoon />
                  <p>
                    A way to offer tithe to the Archive is being prepared. Until
                    then, the greatest service is to use it and share it with
                    fellow readers.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
