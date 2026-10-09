import Link from "next/link";
import RequestedPath from "./RequestedPath";
import SkipTyping from "./SkipTyping";
import { createTypist } from "./typist";
import styles from "./styles.module.scss";

const LINKS = [
  { href: "/", label: "Return to the Archive" },
  { href: "/books", label: "Search the book records" },
  { href: "/authors", label: "Consult the author index" },
  { href: "/series", label: "Browse the series" },
];

const CHECKS = [
  { label: "Searching data-vaults", result: "NO MATCH" },
  { label: "Consulting the Logis", result: "INCONCLUSIVE" },
  { label: "Machine spirit", result: "DISPLEASED" },
];

// typing speeds, in ms per character
const FAST = 7;
const NORMAL = 14;
const SLOW = 60;
const PATH_DURATION = 450;
const LINE_PAUSE = 160;

/** 404 page styled as a cogitator terminal failing to find a record */
export default function NotFound() {
  // the readout types out top to bottom, so each line is built in order
  const t = createTypist();

  const header = (
    <p className={styles.dim} style={t.at()}>
      {t.type("+++ COGITATOR ARRAY 7-ALPHA // NOOSPHERIC QUERY +++", FAST)}
    </p>
  );
  t.wait(LINE_PAUSE);

  const queryStart = t.at();
  const queryLabel = t.type("> Query", NORMAL);
  const queryLeader = t.at();
  const pathStart = t.now();
  t.wait(PATH_DURATION + LINE_PAUSE);

  const checks = CHECKS.map(({ label, result }) => {
    const lineStart = t.at();
    const labelText = t.type(`> ${label}`, NORMAL);
    const leader = t.at();
    t.wait(LINE_PAUSE); // the cogitator "thinks" before each result
    const resultText = t.type(result, NORMAL);
    t.wait(LINE_PAUSE);

    return (
      <p key={label} style={lineStart}>
        {labelText}
        <span className={styles.leader} style={leader} />
        <span className={styles.fault}>{resultText}</span>
      </p>
    );
  });
  t.wait(LINE_PAUSE);

  const code = (
    <div className={styles.code} style={t.at()}>
      {t.type("FAULT 404", NORMAL)}
    </div>
  );
  t.wait(LINE_PAUSE);

  const titleStart = t.at();
  const titleText = t.type("Record not found", SLOW);
  const cursorAt = t.at();
  t.wait(LINE_PAUSE * 2);

  const message = (
    <p className={styles.message} style={t.at()}>
      {t.type(
        "The record you seek has been lost to the warp, expunged by order of the Inquisition, or never existed at all. Check the address, or choose a new query below.",
        FAST,
      )}
    </p>
  );
  t.wait(LINE_PAUSE);

  const options = LINKS.map(({ href, label }, i) => {
    const item = (
      <li key={href} style={t.at()}>
        <Link href={href} className={styles.option}>
          <span className={styles.optionKey}>{t.type(`[${i + 1}]`, FAST)}</span> {t.type(label, FAST)}
        </Link>
      </li>
    );
    t.wait(LINE_PAUSE / 2);
    return item;
  });
  t.wait(LINE_PAUSE);

  const thought = (
    <p className={styles.dim} style={t.at()}>
      {t.type("> Thought for the day: Hope is the first step on the road to disappointment.", FAST)}
    </p>
  );

  return (
    <main className={styles.screen}>
      <SkipTyping className={styles.readout}>
        {header}
        <p style={queryStart}>
          {queryLabel}
          <span className={styles.leader} style={queryLeader} />
          <span className={styles.path}>
            <RequestedPath start={pathStart} duration={PATH_DURATION} />
          </span>
        </p>
        {checks}

        {code}
        <h1 className={styles.title} style={titleStart}>
          {titleText}
          <span className={styles.cursor} style={cursorAt} aria-hidden="true" />
        </h1>

        {message}

        <nav className={styles.options} aria-label="Where to go next">
          <ol>{options}</ol>
        </nav>

        {thought}
      </SkipTyping>

      <div className={styles.status} aria-hidden="true">
        <span>Imperial Archive</span>
        <span>Status: Fault</span>
      </div>

      <div className={styles.scanlines} aria-hidden="true" />
    </main>
  );
}
