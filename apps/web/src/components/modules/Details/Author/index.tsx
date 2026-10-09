import Image from "next/image";
import RichText from "@/components/ui/RichText";
import { urlFor } from "@/lib/sanity/sanity.image";
import FavoriteButton from "@/components/modules/FavoriteButton";
import DetailCard from "../base";
import Clamp from "../clamp";
import DetailLinks from "../links";
import type { Author40k } from "@/types/sanity";
import styles from "../styles.module.scss";

function getInitials(fullName: string) {
  if (!fullName) return null;
  const parts = fullName
    .replace(/\./g, " ")
    .replace(/[\u2019']/g, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const initials = parts.map((p) => p.match(/\p{L}/u)?.[0] || "").join("");
  return initials ? initials.toUpperCase() : null;
}

export default function AuthorDetailCard({ author }: { author: Author40k }) {
  const initials = getInitials(author.name);

  const media = author.image ? (
    <div className={styles.authorImage} aria-hidden="true" title={author.name}>
      <Image
        src={urlFor(author.image).width(200).height(200).fit("crop").url()}
        alt={author.name}
        width={200}
        height={200}
        priority
        unoptimized
        placeholder="blur"
        blurDataURL={author.image?.lqip || undefined}
      />
    </div>
  ) : (
    <div className={`${styles.authorImage} ${styles.authorInitials}`} aria-hidden="true" title={author.name}>
      {initials}
    </div>
  );

  return (
    <DetailCard
      media={media}
      title={<h1>{author.name}</h1>}
      description={
        author.bio ? (
          <Clamp>
            <div className="rich-text">
              <RichText value={author.bio} />
            </div>
          </Clamp>
        ) : null
      }
      actions={<DetailLinks items={(author.links ?? []).filter((l) => l?.url) as any} />}
      footer={<FavoriteButton kind="author" itemId={author._id} />}
    />
  );
}
