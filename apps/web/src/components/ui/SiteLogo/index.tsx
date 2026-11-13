import styles from "./styles.module.scss";

/**
 * The Imperial Archive wordmark, drawn from /imperial-archive-logo.svg as a CSS
 * mask in the current text color. Inlining the SVG put its ~21KB of path data
 * into every page twice (nav and footer) plus the React payload; as a mask
 * it's one cached file. Decorative: the link around it carries the name.
 * Size it with a class (it fills its box, logo centered and contained).
 */
export default function SiteLogo({ className = "" }: { className?: string }) {
  return <span className={`${styles.logo} ${className}`} aria-hidden="true" />;
}
