import Button from "@/components/ui/Button";
import HeartIcon from "@/components/icons/account/favorites.svg";
import styles from "./styles.module.scss";

const TAGS = [
  { label: "Want to read", className: styles.tagWant },
  { label: "Reading", className: styles.tagReading },
  { label: "Read", className: styles.tagRead },
  { label: "Owned", className: styles.tagOwned },
];

/** Homepage pitch for the reading tracker, linking to the /track guide */
export default function TrackerPromo() {
  return (
    <section className={styles.promo} aria-labelledby="reading-tracker">
      <div className={styles.text}>
        <span className={styles.kicker}>Free with an account</span>
        <h2 id="reading-tracker">Warhammer 40k Reading Tracker</h2>
        <p>
          Log every Black Library book you want to read, are reading, have finished and own, from any book card
          or book page. Make your own lists too, like a wishlist, a reading order or a to-buy pile. Your reading
          log is saved to your account, so it follows you to any device.
        </p>
        <div className={styles.actions}>
          <Button href="/track" variant="primary">
            How the reading tracker works
          </Button>
          <Button href="/books" variant="tertiary">
            Browse books
          </Button>
        </div>
      </div>

      <div className={styles.example}>
        {/* the tags tracked books get, as on book cards */}
        <ul className={styles.tags} aria-label="Tracking statuses">
          {TAGS.map(({ label, className }) => (
            <li key={label} className={`${styles.tag} ${className}`}>
              {label}
            </li>
          ))}
          <li className={styles.heart}>
            <HeartIcon aria-hidden="true" />
            <span className={styles.visuallyHidden}>Favorite</span>
          </li>
        </ul>

        {/* the book page's list action, shown as an example like the tags above */}
        <span className={styles.addToList} aria-hidden="true">
          + Add to list
        </span>
      </div>
    </section>
  );
}
