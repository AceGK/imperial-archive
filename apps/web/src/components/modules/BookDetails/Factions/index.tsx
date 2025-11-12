import Link from "next/link";
import Badge from "@/components/ui/Badge";
import styles from "./styles.module.scss";

interface Faction {
  title?: string;
  slug?: string;
  groupSlug?: string;
}

interface FactionsSectionProps {
  factions: Faction[];
}

export default function FactionsSection({ factions }: FactionsSectionProps) {
  return (
    <div className={styles.factionsList}>
      {factions.map((f: Faction, i: number) => {
        const href =
          f?.groupSlug && f?.slug
            ? `/factions/${f.groupSlug}/${f.slug}`
            : null;

        const label = f?.title ?? f?.slug ?? "Unknown";

        return (
          <span key={f?.slug ?? i}>
            {href ? (
              <Link href={href} className={styles.factionLink}>
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
            {i < factions.length - 1 && ", "}
          </span>
        );
      })}
    </div>
  );
}

export function FactionsTrigger() {
  return (
    <>
      Factions{" "}
      <Badge variant="secondary" size="sm">
        May Contain Spoilers
      </Badge>
    </>
  );
}