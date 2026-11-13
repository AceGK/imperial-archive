// /components/modules/Carousel/FactionCarousel/index.tsx  (server)
import FactionCarouselClient from "./client";
import { client } from "@/lib/sanity/sanity.client";
import { groupedFactions40kQuery } from "@/lib/sanity/queries";
import type { FactionGroupWithItems } from "@/types/sanity";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  initialGroupKey?: string;   // eg "space-marines"
  basePath?: string; // defaults to "/factions"
  className?: string;
};

export default async function FactionCarousel({
  title,
  subtitle,
  initialGroupKey,
  basePath = "/factions",
  className,
}: Props) {
  const groups = await client.fetch<FactionGroupWithItems[]>(groupedFactions40kQuery, {}, { perspective: "published" });

  // adapt to client shape: { key, meta, items[] }. Only what the tabs and
  // cards show: every faction's lore description and links went into the page
  // payload unused (~25KB on the homepage)
  const adapted = groups.map(g => ({
    key: g.slug,
    meta: { title: g.title, iconId: g.iconId },
    items: g.items.map(it => ({
      _id: it._id,
      title: it.title,
      slug: it.slug,
      iconId: it.iconId,
    })),
  }));

  return (
    <FactionCarouselClient
      title={title}
      subtitle={subtitle}
      groups={adapted}
      initialGroupKey={initialGroupKey ?? adapted[0]?.key}
      basePath={basePath}
      className={className}
    />
  );
}
