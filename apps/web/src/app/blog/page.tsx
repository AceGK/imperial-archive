import { getAllBlogPosts } from "@/lib/sanity/queries";
import { client } from "@/lib/sanity/sanity.client"
import type { BlogPost } from "@/types/sanity";
import PageHeader from "@/components/modules/PageHeader"

export default async function BlogPage() {
	const posts = await client.fetch<BlogPost[]>(getAllBlogPosts());

	return (
		<main>

			<PageHeader
				title="Blog"
				subtitle="Lorem Ipsum Dolor Sit Amet"
				align="center"
				strongOverlay
				height="sm"
				priority
				image="/images/black-library-books.jpg"
				credit="Black Library © Games Workshop"
			/>

			<div>
				{posts.map((post) => (
					<article key={post._id}>
						<h2>{post.title}</h2>
						<p>{post.metaDescription}</p>
					</article>
				))}
			</div>
		</main>
	);
}