'use client'

import { cn } from '@/common/utils'
import { RecommendedMap } from '@ssr/common/schemas/response/player/map-recommendations'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Star } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface PlayerRecommenderProps {
  playerId: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-500',
  Normal: 'bg-sky-500',
  Hard: 'bg-orange-400',
  Expert: 'bg-red-500',
  ExpertPlus: 'bg-purple-500',
}

const LIMIT_OPTIONS = [
  6,
  12,
  18,
  24,
]

function RecommendedMapCard({ rec }: { rec: RecommendedMap }) {
  const diffColor = DIFFICULTY_COLORS[rec.difficulty] ?? 'bg-gray-500'
  const shortDiff = rec.difficulty === 'ExpertPlus' ? 'Expert+' : rec.difficulty

  return (
    <Link href={`/leaderboard/${rec.leaderboardId}`}>
      <div className="group relative h-52 overflow-hidden rounded-xl border border-white/10
      transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/40">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${rec.coverImage})` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/10" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold text-white', diffColor)}>
            {shortDiff}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="size-4 text-white/60" />
        </div>

        <div className="absolute right-0 bottom-0 left-0 p-3">
          <p className="truncate text-sm font-bold leading-tight text-white">{rec.songName}</p>
          {rec.songSubName && (
            <p className="truncate text-xs text-white/50">{rec.songSubName}</p>
          )}
          <p className="mb-2 truncate text-xs text-white/40">{rec.songAuthorName}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-md bg-primary/80 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              ~{rec.averagePp.toFixed(1)} pp
            </div>
            {rec.stars > 0 && (
              <div className="flex items-center gap-0.5 rounded-md bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-400 backdrop-blur-sm">
                {rec.stars.toFixed(2)}
                <Star className="size-3 fill-yellow-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="h-52 animate-pulse rounded-xl border border-white/10 bg-white/5" />
  )
}

export function PlayerRecommender({ playerId }: PlayerRecommenderProps) {
  const [ limit, setLimit ] = useState(LIMIT_OPTIONS[1])

  const { data, isLoading } = useQuery({
    queryKey: [ 'map-recommendations', playerId, limit ],
    queryFn: () => ssrApi.getMapRecommendations(playerId, limit),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">
          Based on what players around your rank are playing.
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {LIMIT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                limit === n
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
          : data?.recommendations?.length
            ? data.recommendations.map((rec: RecommendedMap) => (
              <RecommendedMapCard key={rec.leaderboardId} rec={rec} />
            ))
            : (
              <div className="col-span-full rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-white/30">
                Not enough data to generate recommendations.
              </div>
            )
        }
      </div>
    </div>
  )
}
