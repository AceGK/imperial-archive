import Image from "next/image";
import Button from "@/components/ui/Button";
import PlusIcon from "@/components/icons/plus.svg";
import HourglassIcon from "@/components/icons/hourglass.svg";
import HalfCircleIcon from "@/components/icons/half-circle.svg";
import CheckIcon from "@/components/icons/check.svg";
import BookIcon from "@/components/icons/book.svg";
import ShareIcon from "@/components/icons/share.svg";
import HeartIcon from "@/components/icons/account/favorites.svg";
import BookWall from "@/components/modules/Hero/BookWall";
import FirstTomeIcon from "@/components/icons/achievements/first-tome.svg";
import InitiateIcon from "@/components/icons/achievements/initiate.svg";
import LibrariusIcon from "@/components/icons/achievements/librarius.svg";
import CompletionistIcon from "@/components/icons/achievements/completionist.svg";
import ChroniclerIcon from "@/components/icons/achievements/chronicler.svg";
import InquisitorIcon from "@/components/icons/achievements/inquisitor.svg";
import styles from "./styles.module.scss";

/*
 * The /track page: how reading tracking works, with two looping, CSS-only
 * walkthroughs (a book card and a book page) built from static copies of the
 * real controls, then what's coming next. The walkthroughs are decorative;
 * the numbered steps beside each carry the same instructions in text.
 */

const COVER = "/images/book-covers/the-twice-dead-king-ruin.jpg";

// local covers for the intro's drifting book wall
const WALL_COVERS = [
  "the-twice-dead-king-ruin", "fabius-bile-primogenitor", "lupercals-war", "grey-knights",
  "titanicus", "dead-men-walking", "the-emperors-gift", "helbrecht-knight-of-the-throne",
  "gods-of-mars", "fifteen-hours", "the-infinite-and-the-divine", "lucius-the-faultless-blade",
  "siege-of-vraks", "path-of-the-warrior", "kingsblade", "the-triumph-of-saint-katherine",
  "warlord-fury-of-the-god-machine", "requiem-infernal", "straken", "the-red-path",
].map((name) => `/images/book-covers/${name}.jpg`);

const Cursor = () => (
  <svg className={styles.cursor} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 2.5v17.2l4.6-4.2 3 6.7 3-1.4-3-6.6 6.2-.4z" />
  </svg>
);

/** A grid card: hover, open Track, choose Reading, and the tag appears */
function CardDemo() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={`${styles.stageInner} ${styles.stageCard}`}>
      <div className={styles.demoCard}>
        <div className={styles.demoCover}>
          <Image src={COVER} alt="" fill sizes="190px" />
          <span className={styles.demoShade} />
          <span className={`${styles.demoTag} ${styles.demoTagPop}`}>Reading</span>
          <span className={styles.demoTrack}>
            <PlusIcon /> Track
          </span>
        </div>
        <div className={styles.demoCardBody}>
          <span className={styles.demoTitle}>The Twice-Dead King: Ruin</span>
          <span className={styles.demoAuthor}>Nate Crowley</span>
        </div>
      </div>

      <div className={styles.demoMenu}>
        <span className={styles.demoMenuHeading}>Reading status</span>
        <span className={styles.demoMenuItem}>
          <HourglassIcon /> Want to read
        </span>
        <span className={`${styles.demoMenuItem} ${styles.demoMenuPick}`}>
          <HalfCircleIcon /> Reading <span className={styles.demoTick}>✓</span>
        </span>
        <span className={styles.demoMenuItem}>
          <CheckIcon /> Read
        </span>
        <span className={styles.demoMenuDivider} />
        <span className={styles.demoMenuItem}>
          <BookIcon /> Owned
        </span>
        <span className={styles.demoMenuItem}>
          <HeartIcon /> Favorite
        </span>
      </div>

      <Cursor />
      <span className={`${styles.cursorClick} ${styles.cardClick}`} />
      </div>
    </div>
  );
}

const STATUS_FRAMES = [
  { label: "Unread", icon: PlusIcon, frame: styles.frameUnread },
  { label: "Want to read", icon: HourglassIcon, frame: styles.frameWant },
  { label: "Reading", icon: HalfCircleIcon, frame: styles.frameReading },
  { label: "Read", icon: CheckIcon, frame: styles.frameRead },
];

/** A book page's action row: the status button steps through, then Owned and Favorite */
function PageDemo() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={`${styles.stageInner} ${styles.stageRow}`}>
      <div className={styles.demoRow}>
        <span className={`${styles.demoButton} ${styles.demoStatus}`}>
          <span className={styles.demoLabels}>
            {STATUS_FRAMES.map(({ label, icon: Icon, frame }) => (
              <span key={label} className={`${styles.demoLabel} ${frame}`}>
                <Icon /> {label}
              </span>
            ))}
          </span>
          <span className={styles.demoDots}>
            <span className={`${styles.demoDot} ${styles.dot1}`} />
            <span className={`${styles.demoDot} ${styles.dot2}`} />
            <span className={`${styles.demoDot} ${styles.dot3}`} />
          </span>
        </span>
        <span className={`${styles.demoButton} ${styles.demoOwned}`}>
          <BookIcon /> Owned
        </span>
        <span className={`${styles.demoButton} ${styles.demoSquare} ${styles.demoHeart}`}>
          <HeartIcon />
        </span>
        <span className={`${styles.demoButton} ${styles.demoSquare} ${styles.demoShare}`}>
          <ShareIcon />
        </span>
      </div>

      {/* the tags the book gets on cards as its status moves on */}
      <div className={styles.demoTagsRow}>
        <span className={styles.demoTagsLabel}>On cards:</span>
        {/* one tag whose text and style follow the status (set in CSS) */}
        <span className={`${styles.demoTag} ${styles.demoStatusTag}`} />
        <span className={`${styles.demoTag} ${styles.demoTagOwned} ${styles.tagOwnedFrame}`}>Owned</span>
        <span className={`${styles.demoHeartTag} ${styles.tagHeartFrame}`}>
          <HeartIcon />
        </span>
      </div>

      <Cursor />
      <span className={`${styles.cursorClick} ${styles.pageClick}`} />
      </div>
    </div>
  );
}

const STATUSES = [
  { label: "Want to read", tag: styles.demoTagWant, text: "On your list for later. Shown with a dashed outline." },
  { label: "Reading", tag: "", text: "In progress right now. Shown with a solid outline." },
  { label: "Read", tag: styles.demoTagRead, text: "Finished. Shown filled in gold." },
];

const SOON = [
  {
    title: "Series progress",
    text: "See how far through a series you are, and what to read next in its reading order.",
    bars: [
      { label: "Horus Heresy", done: 12, total: 54 },
      { label: "Gaunt's Ghosts", done: 9, total: 30 },
    ],
  },
  {
    title: "Eras, factions & authors",
    text: "Your reading broken down by era, faction and author, so you can spot the gaps.",
    bars: [
      { label: "Ultramarines", done: 7, total: 23 },
      { label: "Dan Abnett", done: 15, total: 92 },
    ],
  },
];

// icons from wh40k-icon (credited on the About page)
const ACHIEVEMENTS = [
  { icon: FirstTomeIcon, name: "First Tome", text: "Read your first book" },
  { icon: InitiateIcon, name: "Initiate", text: "Read 10 books" },
  { icon: LibrariusIcon, name: "Librarius", text: "Read 100 books" },
  { icon: CompletionistIcon, name: "Completionist", text: "Finish a whole series" },
  { icon: ChroniclerIcon, name: "Chronicler", text: "Read a book from every era" },
  { icon: InquisitorIcon, name: "Inquisitor", text: "Read books featuring 10 factions" },
];

export default function TrackGuide() {
  return (
    <div className={styles.guide}>
      <section className={styles.intro}>
        <div className={styles.introText}>
        <p className={styles.lead}>
          Keep a log of your journey through the Black Library: what you want to read, what you&apos;re reading
          now, what you&apos;ve finished, and what&apos;s on your shelf. It&apos;s free with an account, and it
          follows you to any device.
        </p>
        <ul className={styles.statusList}>
          {STATUSES.map(({ label, tag, text }) => (
            <li key={label}>
              <span className={`${styles.demoTag} ${tag}`}>{label}</span>
              <span>{text}</span>
            </li>
          ))}
          <li>
            <span className={`${styles.demoTag} ${styles.demoTagOwned}`}>Owned</span>
            <span>Books in your collection. Separate from reading status: a book can be Read and Owned.</span>
          </li>
          <li>
            <span className={styles.demoHeartTag}>
              <HeartIcon />
            </span>
            <span>Favorites, for the books you love most.</span>
          </li>
        </ul>
        </div>

        {/* the hero's drifting book wall, in miniature */}
        <div className={styles.introArt} aria-hidden="true">
          <div className={styles.introArtWall}>
            <BookWall images={WALL_COVERS} coverWidth="92px" columns={9} rows={6} />
          </div>
        </div>
      </section>

      <section className={styles.method} aria-labelledby="from-a-card">
        <div className={styles.methodText}>
          <span className={styles.kicker}>Method I</span>
          <h2 id="from-a-card">From any book card</h2>
          <p>Track books straight from the catalog, sliders and search results, without opening them.</p>
          <ol className={styles.steps}>
            <li>Hover over a book&apos;s cover (on a phone, the Track button is always there).</li>
            <li>
              Press <strong>Track</strong> at the bottom of the cover.
            </li>
            <li>Pick a reading status, or toggle Owned and Favorite. Pick a status again to clear it.</li>
            <li>The book&apos;s tags appear on its cover, so you can see your progress at a glance.</li>
          </ol>
          <p className={styles.tip}>
            In list view, the Track button sits at the end of each row, with the tags just above it.
          </p>
        </div>
        <CardDemo />
      </section>

      <section className={`${styles.method} ${styles.methodFlip}`} aria-labelledby="from-a-page">
        <div className={styles.methodText}>
          <span className={styles.kicker}>Method II</span>
          <h2 id="from-a-page">From a book&apos;s page</h2>
          <p>Every book page has the same controls next to its title.</p>
          <ol className={styles.steps}>
            <li>
              Press the status button to step through <strong>Want to read</strong>, <strong>Reading</strong>{" "}
              and <strong>Read</strong>; once more returns it to Unread. The dots show how far along you are.
            </li>
            <li>
              Press <strong>Owned</strong> if the book is in your collection.
            </li>
            <li>Press the heart to add it to your favorites.</li>
          </ol>
        </div>
        <PageDemo />
      </section>

      <section className={styles.tracker} aria-labelledby="your-tracker">
        <h2 id="your-tracker">Everything in one place</h2>
        <p>
          Your tracked books are gathered on your account&apos;s Track page, sorted into Reading, Want to Read,
          Read and Owned, with the most recently changed first.
        </p>
        <div className={styles.actions}>
          <Button href="/account/track" variant="bracket">
            Open your tracker
          </Button>
          <Button href="/signup" variant="outline">
            Create a free account
          </Button>
        </div>
      </section>

      <section className={styles.soon} aria-labelledby="coming-soon">
        <div className={styles.soonHeader}>
          <span className={styles.soonBadge}>Coming soon</span>
          <h2 id="coming-soon">Progress and achievements</h2>
          <p>Tracking is the foundation. Here&apos;s what we&apos;re building on top of it.</p>
        </div>

        <div className={styles.soonGrid}>
          {SOON.map(({ title, text, bars }) => (
            <article key={title} className={styles.soonCard}>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className={styles.bars} aria-hidden="true">
                {bars.map(({ label, done, total }) => (
                  <div key={label} className={styles.bar}>
                    <span className={styles.barLabel}>
                      {label}
                      <span>
                        {done} / {total}
                      </span>
                    </span>
                    <span className={styles.barTrack}>
                      <span className={styles.barFill} style={{ width: `${(done / total) * 100}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <article className={`${styles.soonCard} ${styles.soonWide}`}>
            <h3>Achievements</h3>
            <p>Earn honours as your reading grows, from your first finished book to completing entire sagas.</p>
            <ul className={styles.badges}>
              {ACHIEVEMENTS.map(({ icon: Icon, name, text }) => (
                <li key={name} className={styles.badge}>
                  <span className={styles.badgeMark} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className={styles.badgeName}>{name}</span>
                  <span className={styles.badgeText}>{text}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
