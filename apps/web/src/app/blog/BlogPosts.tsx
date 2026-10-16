"use client";

import BlogCard from "@/components/modules/Cards/BlogCard";
import { ViewToggle, useStoredView } from "@/components/modules/Catalog/ViewToggle";
import type { BlogPost } from "@/types/sanity";
import styles from "./styles.module.scss";

/** The /blog posts as a grid of cards or a list of rows, remembered in this browser */
export default function BlogPosts({ posts }: { posts: BlogPost[] }) {
  const [view, setView] = useStoredView("blog-view", "grid");

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
        <ViewToggle view={view} onChange={setView} />
      </div>
      <div className={view === "list" ? styles.list : styles.grid}>
        {posts.map((post) => (
          <BlogCard key={post._id} post={post} layout={view} />
        ))}
      </div>
    </>
  );
}
