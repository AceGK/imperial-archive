import type { Metadata } from "next";
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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

export default function AboutPage() {
  return (
    <main>
      <section className="container row__lg">
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.ref}>Adeptus Administratum · IA-001 / Dossier</div>
            <h1 className={styles.title}>About this project</h1>
            <div className={styles.divider} />
          </header>

          <div className={styles.sections}>
            <Card eyebrow="§ I · Charter" title="The Archive">
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

            <Card eyebrow="§ II · Archivist" title="The Creator">
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

            <Card eyebrow="§ III · Sanctioned Sources" title="Attribution & Credits">
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

                {/* <Card eyebrow="§ IV · Vox" title="Contact" align="center">
                <p>
   
                </p>
              </Card> */}
{/* 
            <div className={styles.linkGrid}>
              <Card eyebrow="§ IV · Vox" title="Contact" align="center">
              </Card>

              <Card eyebrow="§ V · Codex" title="FAQ" align="center">

                <Button href="/faq" variant="bracket" size="sm">
                  Read the FAQ
                </Button>
              </Card>

              <Card eyebrow="§ VI · Tithe" title="Support" align="center">
                <p>Help keep the Archive running and growing.</p>
                <Button href="/support" variant="bracket" size="sm">
                  Support the Archive
                </Button>
              </Card> 
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
