'use client'

import { env } from '@ssr/common/env'
import { AppStatisticsResponse } from '@ssr/common/schemas/response/ssr/app-statistics'
import Request from '@ssr/common/utils/request'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import {
  Database, History, Target, Trophy, User, Video,
} from 'lucide-react'
import CountUp from 'react-countup'

export default function LandingStats() {
  const { data: appStatistics } = useQuery({
    queryKey: [ 'app-statistics' ],
    queryFn: () => Request.get<AppStatisticsResponse>(env.NEXT_PUBLIC_API_URL + '/statistics'),
    refetchInterval: 60_000,
  })

  const { data: scoreSaberStats } = useQuery({
    queryKey: [ 'scoresaber-statistics' ],
    queryFn: () => ssrApi.getScoreSaberStatistics(),
    refetchInterval: 60_000,
  })

  const dailyActive = scoreSaberStats?.statistics?.daily
  const todayKey = dailyActive ? Object.keys(dailyActive).pop() : undefined
  const todayStats = todayKey ? dailyActive?.[todayKey] : undefined

  const stats = appStatistics
    ? [
      {
        icon: User,
        label: 'Active Players',
        value: appStatistics.activePlayers,
      },
      {
        icon: Trophy,
        label: 'Leaderboards',
        value: appStatistics.leaderboardCount,
      },
      {
        icon: Target,
        label: 'Tracked Scores',
        value: appStatistics.trackedScores,
      },
      {
        icon: Database,
        label: 'Score History',
        value: appStatistics.scoreHistoryScores,
      },
      {
        icon: Video,
        label: 'Stored Replays',
        value: appStatistics.storedReplays,
      },
      {
        icon: History,
        label: 'Daily Unique',
        value: todayStats?.dailyUniquePlayers ?? 0,
      },
    ]
    : []

  return (
    <section className="mx-auto max-w-6xl px-(--spacing-xl) md:px-(--spacing-2xl)">
      <div className="border-border/50 bg-card/50 rounded-2xl border p-(--spacing-xl)">
        <div className="mb-(--spacing-lg) flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Live Statistics</h2>
            <p className="text-muted-foreground text-xs">Real-time platform metrics</p>
          </div>
          {todayStats && (
            <div className="text-right text-xs">
              <p className="text-muted-foreground">Today</p>
              <p className="font-medium tabular-nums">{todayStats.dailyUniquePlayers ?? 0} unique players</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-(--spacing-md) sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(stat => (
            <div key={stat.label}>
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                <stat.icon className="size-3" />
                <span>{stat.label}</span>
              </div>
              <p className="text-xl font-bold tabular-nums">
                <CountUp end={stat.value} duration={1.5} separator="," enableScrollSpy scrollSpyOnce preserveValue />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
