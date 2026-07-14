'use client'

import dynamic from 'next/dynamic'

const LandingStats = dynamic(() => import('@/components/landing/landing-stats'), { ssr: false })
const MiniLiveFeed = dynamic(() => import('@/components/landing/mini-live-feed'), { ssr: false })
const LandingRankedMaps = dynamic(() => import('@/components/landing/landing-ranked-maps'), { ssr: false })

export default function LandingDynamic() {
  return (
    <>
      <section className="pb-(--spacing-2xl)">
        <LandingStats />
      </section>

      <section className="mx-auto mb-(--spacing-2xl) max-w-6xl px-(--spacing-xl) md:px-(--spacing-2xl)">
        <MiniLiveFeed />
      </section>

      <section className="mx-auto mb-(--spacing-2xl) max-w-6xl px-(--spacing-xl) md:px-(--spacing-2xl)">
        <LandingRankedMaps />
      </section>
    </>
  )
}
