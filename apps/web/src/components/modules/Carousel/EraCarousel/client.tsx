'use client'

import React from 'react'
import Carousel from '@/components/modules/Carousel'
import EraCard from '@/components/modules/EraCard'
import type {SwiperOptions} from 'swiper/types'
import type {Era40k} from '@/types/sanity'

type Props = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  eras: Era40k[]
  className?: string
  viewAllLink?: string
  viewAllLabel?: string
  compact?: boolean
}

const breakpoints: SwiperOptions['breakpoints'] = {
  480:  {slidesPerView: 2.1, spaceBetween: 12},
  640:  {slidesPerView: 3,   spaceBetween: 14},
  900:  {slidesPerView: 4,   spaceBetween: 16},
  1200: {slidesPerView: 5,   spaceBetween: 18},
}

export default function EraCarouselClient({
  title,
  subtitle,
  eras,
  className,
  viewAllLink,
  viewAllLabel = 'View All Eras',
  compact = true,
}: Props) {
  const items = eras.map(e => (
    <EraCard
      key={e._id}
      title={e.title}
      slug={e.slug}
      period={e.period}
      description={e.description}
      image={e.image}         // expects {url,lqip,aspect}
      compact={compact}
    />
  ))

  return (
    <Carousel
      title={title}
      subtitle={subtitle}
      items={items}
      slidesPerView={1.2}
      spaceBetween={12}
      breakpoints={breakpoints}
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllLabel={viewAllLabel}
    />
  )
}
