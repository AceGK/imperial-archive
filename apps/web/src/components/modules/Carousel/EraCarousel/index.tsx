import { client } from '@/lib/sanity/sanity.client'
import { all40kErasQuery } from '@/lib/sanity/queries'
import type { Era40k } from '@/types/sanity'
import EraCarouselClient from './client'

type Props = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  viewAllLink?: string
  viewAllLabel?: string
  compact?: boolean
}

export const revalidate = 60

export default async function EraCarousel(props: Props) {
  const eras = await client.fetch<Era40k[]>(all40kErasQuery, {}, {perspective: 'published'})
  return <EraCarouselClient eras={eras} {...props} />
}
