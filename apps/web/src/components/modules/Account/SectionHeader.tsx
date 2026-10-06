import styles from "./styles.module.scss";

export default function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className={styles.sectionHeader}>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
