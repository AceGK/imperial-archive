import ComingSoon from "@/components/modules/ComingSoon";
import InfoHeader from "@/components/modules/InfoHeader";
import BlogCard from "@/components/modules/Cards/BlogCard";
import { client } from "@/lib/sanity/sanity.client";
import { blogPostsQuery } from "@/lib/sanity/queries";
import { pageMetadata } from "@/lib/seo";
import type { BlogPost } from "@/types/sanity";
import styles from "./styles.module.scss";

export const revalidate = 60;

const TITLE = "Blog";
const LABEL = "Adeptus Administratum · IA-004 // Chronicles";

async function getPosts() {
  return client.fetch<BlogPost[]>(blogPostsQuery);
}

export async function generateMetadata() {
  const posts = await getPosts();
  return pageMetadata({
    title: TITLE,
    description:
      "News, updates, and articles from Imperial Archive, the fan-made catalog of Warhammer 40,000 Black Library books.",
    path: "/blog",
    // stays out of search until there are posts to show
    noindex: posts.length === 0,
  });
}

export default async function BlogPage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <ComingSoon
        eyebrow={LABEL}
        title={TITLE}
        description="Dispatches from the Archive are being prepared. Check back soon."
      />
    );
  }

  return (
    <main>
      <section className="container row__md">
        <div className={styles.content}>
          <InfoHeader label={LABEL} title={TITLE} />
          <div className={styles.grid}>
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
