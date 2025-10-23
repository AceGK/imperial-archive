// /app/authors/[slug]/page.tsx
import {notFound} from 'next/navigation'
import {client} from '@/lib/sanity/sanity.client'
import {single40kAuthorQuery} from '@/lib/sanity/queries'
import {getAllBooks, type Book} from '@/lib/40k-books'
import type {Author40k} from '@/types/sanity'
import AuthorProfile from '@/components/modules/AuthorProfile'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const revalidate = 60

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const authors = await client.fetch<{slug: string}[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`
  )
  return authors.map(a => ({slug: a.slug}))
}

export default async function AuthorPage(
  { params }: { params: Promise<Params> } 
) {
  const { slug } = await params

  const profile = await client.fetch<Author40k | null>(
    single40kAuthorQuery,
    { slug },
    { perspective: 'published' }
  )
  if (!profile) notFound()

  const books = getAllBooks()
  const authored: Book[] = books
    .filter(b => (b.author ?? []).some(n => n.trim() === profile.name))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <main className="container">
      <Breadcrumb /> 
      <AuthorProfile slug={slug} profile={profile} authored={authored} />
    </main>
  )
}
