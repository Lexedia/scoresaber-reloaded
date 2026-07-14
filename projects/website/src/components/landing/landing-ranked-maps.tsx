'use client'

import SimpleLink from '@/components/simple-link'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { getDifficulty } from '@ssr/common/utils/song-utils'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { Star } from 'lucide-react'

const MAX_ITEMS = 10

export default function LandingRankedMaps() {
  const { data, isLoading } = useQuery({
    queryKey: [ 'landing-recently-ranked' ],
    queryFn: () =>
      ssrApi.searchLeaderboards(1, {
        ranked: true,
        category: 'date_ranked',
        sort: 'desc',
      }),
    refetchInterval: 120_000,
  })

  const allMaps = data?.items ?? []

  const grouped = allMaps.reduce<Record<string, typeof allMaps>>((acc, lb) => {
    const key = lb.songHash
    if (!acc[key])
      acc[key] = []
    acc[key].push(lb)
    return acc
  }, {})

  const songs = Object.values(grouped).slice(0, MAX_ITEMS)

  return (
    <div className="border-border/50 bg-card/50 rounded-2xl border p-(--spacing-xl)">
      <div className="mb-(--spacing-lg) flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recently Ranked</h2>
          <p className="text-muted-foreground text-xs">Latest ranked leaderboards</p>
        </div>
        <SimpleLink
          href="/maps/leaderboards?ranked=true"
          className="text-primary/70 hover:text-primary text-xs transition-colors"
        >
          View all
        </SimpleLink>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-(--spacing-xl)">
          <p className="text-muted-foreground/50 text-xs">Loading...</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="flex items-center justify-center py-(--spacing-xl)">
          <p className="text-muted-foreground/50 text-xs">No ranked maps found</p>
        </div>
      ) : (
        <div className="-mx-(--spacing-xl) flex flex-col divide-y divide-white/[0.03]">
          {songs.map((diffs, i) => {
            const first = diffs[0]
            const starMin = Math.min(...diffs.filter(d => d.ranked).map(d => d.stars))
            const starMax = Math.max(...diffs.filter(d => d.ranked).map(d => d.stars))
            return (
              <SimpleLink
                key={first.songHash}
                href={`/leaderboard/${diffs[0].id}`}
                className="flex items-center gap-3 px-(--spacing-xl) py-2.5 transition-colors hover:bg-white/[0.015]"
              >
                <span className="text-muted-foreground/30 w-4 text-right text-[10px] tabular-nums">{i + 1}</span>
                <div className="relative size-7 shrink-0 overflow-hidden rounded-md">
                  <Image src={first.songArt} alt={first.songName} fill className="object-cover" sizes="28px" />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium">{first.songName}</span>
                  <span className="text-muted-foreground/50 hidden truncate text-xs sm:block">
                    {first.levelAuthorName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2 tabular-nums text-xs">
                  <div className="flex gap-1">
                    {diffs.map(d => {
                      const diff = getDifficulty(d.difficulty.difficulty)
                      return (
                        <span
                          key={d.id}
                          className="rounded-sm px-1 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: diff.color + '30',
                            color: diff.color,
                          }}
                        >
                          {diff.shortName}
                        </span>
                      )
                    })}
                  </div>
                  {diffs.some(d => d.ranked) && (
                    <span className="text-pp flex items-center gap-0.5">
                      <Star className="size-3" />
                      <span className="font-medium">
                        {starMin === starMax ? starMin.toFixed(2) : `${starMin.toFixed(2)} - ${starMax.toFixed(2)}`}
                      </span>
                    </span>
                  )}
                </div>
              </SimpleLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
