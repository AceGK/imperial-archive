'use client'

import React from 'react'
import Carousel from '@/components/modules/Carousel/base'
import EraCard from '@/components/modules/Cards/EraCard'
import type {Era40k} from '@/types/sanity'
import HourglassIcon from '@/components/icons/hourglass.svg'

type Props = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  eras: Era40k[]
  className?: string
  viewAllLink?: string
  viewAllLabel?: string
  compact?: boolean
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
      layout="eras"
      loop={false}
      autoplay={false}
      navigation
      pagination={false}
      className={className}
      viewAllLink={viewAllLink}
      viewAllIcon={HourglassIcon}
      viewAllLabel={viewAllLabel}
      showLastSlide={false} 
    />
  )
}
