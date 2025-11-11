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

  // adapt to client shape: { key, meta, items[] }
  const adapted = groups.map(g => ({
    key: g.slug,
    meta: { title: g.title, iconId: g.iconId, description: g.description },
    items: g.items.map(it => ({
      _id: it._id,
      title: it.title,
      slug: it.slug,
      iconId: it.iconId,
      description: it.description,
      links: it.links,
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
