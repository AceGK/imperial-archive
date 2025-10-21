// Server component
import FactionCarouselClient from "./client";
import { getGroupedFactions, type GroupedFactions } from "@/lib/40k-factions";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Defaults to the first group key (e.g. 'space-marines') */
  initialGroupKey?: string;
  /** Base path for links, defaults to '/factions' -> /factions/[group]/[slug] */
  basePath?: string;
  className?: string;
};

export default function FactionCarousel({
  title,
  subtitle,
  initialGroupKey,
  basePath = "/factions",
  className,
}: Props) {
  const groups: GroupedFactions[] = getGroupedFactions();

  return (
    <FactionCarouselClient
      title={title}
      subtitle={subtitle}
      groups={groups}
      initialGroupKey={initialGroupKey}
      basePath={basePath}
      className={className}
    />
  );
}
