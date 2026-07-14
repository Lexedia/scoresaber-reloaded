'use client'

import { Colors } from '@/common/colors'
import {
  detectSessions,
  formatSessionDate,
  formatSessionDuration,
} from '@/common/session/session-utils'
import GenericChart from '@/components/api/chart/generic-chart-dynamic'
import SimpleTooltip from '@/components/simple-tooltip'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import ScoreSaberPlayer from '@ssr/common/player/impl/scoresaber-player'
import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import {
  ArrowDown, ArrowUp, Clock, Gauge, History, Minus, Target, TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'

dayjs.extend(utc)

type Props = {
  player: ScoreSaberPlayer
}

export default function PlayerSessionAnalysis({ player }: Props) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: [ 'player-sessions', player.id ],
    queryFn: async () => {
      const allScores: ScoreSaberScore[] = []
      for (let page = 1; page <= 5; page++) {
        const pageData = await ssrApi.fetchPlayerScoreSaberScores(player.id, page, 'date', 'desc', {})
        if (!pageData)
          break
        allScores.push(...pageData.items.map(item => item.score))
        if (allScores.length >= pageData.metadata.totalItems)
          break
      }
      return detectSessions(allScores)
    },
    staleTime: 60_000,
  })

  const [ selectedSessionId, setSelectedSessionId ] = useState<string | null>(null)

  const session = useMemo(() => {
    if (!sessions || sessions.length === 0)
      return null
    const id = selectedSessionId ?? sessions[0].id
    return sessions.find(s => s.id === id) ?? sessions[0]
  }, [ sessions, selectedSessionId ])

  const ppGained = useMemo(() => {
    if (!session)
      return null
    return session.scores.reduce((sum, s) => {
      const newWeight = s.score.weight
      const oldWeight = s.score.previousScore?.weight ?? 0
      return sum + (newWeight - oldWeight)
    }, 0)
  }, [ session ])

  const chartData = useMemo(() => {
    if (!session || session.accuracyTrend.length < 2)
      return null

    const timeStart = session.accuracyTrend[0].time
    const labels = session.accuracyTrend.map(p => {
      const elapsed = (p.time - timeStart) / 60000
      return `${Math.floor(elapsed / 60)}h${Math.floor(elapsed % 60)}m`
    })

    return {
      chartData: {
        datasets: [
          {
            label: 'Accuracy',
            data: session.accuracyTrend.map(p => p.accuracy),
            color: Colors.pp,
            type: 'line' as const,
            axisId: 'y',
            showLegend: false,
            pointRadius: 3,
          },
        ],
      },
      labels,
    }
  }, [ session ])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">No session data available.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <History className="size-5" />
          Session Analysis
        </h3>
        <Select
          value={session!.id}
          onValueChange={v => setSelectedSessionId(v)}
        >
          <SelectTrigger className="w-[320px] cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessions.map(s => (
              <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                <span className="tabular-nums">{formatSessionDate(s.startTime)}</span>
                <span className="mx-1.5 text-white/30">&middot;</span>
                <span>{s.scores.length} plays</span>
                <span className="mx-1.5 text-white/30">&middot;</span>
                <span>{formatSessionDuration(s.startTime, s.endTime)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {session && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label="PP Gained"
              value={`${ppGained! > 0 ? '+' : ''}${ppGained!.toFixed(1)}pp`}
              valueColor={ppGained! > 0 ? 'text-green-400' : ppGained! < 0 ? 'text-red-400' : undefined}
              tooltip="Net weighted PP change from scores in this session"
            />
            <StatCard
              icon={<Target className="size-4" />}
              label="Avg Accuracy"
              value={`${session.averageAccuracy.toFixed(2)}%`}
              tooltip="Average accuracy across all plays in this session"
            />
            <StatCard
              icon={<Clock className="size-4" />}
              label="Duration"
              value={formatSessionDuration(session.startTime, session.endTime)}
              tooltip="Total time elapsed from first to last play in this session"
            />
            <StatCard
              icon={<Gauge className="size-4" />}
              label="Songs Played"
              value={session.scores.length.toString()}
              tooltip="Total number of songs played in this session"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {chartData && (
              <div className="bg-chart-card rounded-xl border p-4">
                <h4 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                  Accuracy Trend
                </h4>
                <div className="h-72">
                  <GenericChart
                    config={{
                      id: 'session-accuracy-trend',
                      datasets: chartData.chartData.datasets,
                      axes: {
                        x: {
                          display: true,
                          displayName: 'Time',
                          hideOnMobile: false,
                        },
                        y: {
                          display: true,
                          displayName: 'Accuracy (%)',
                          hideOnMobile: false,
                          position: 'left',
                          min: Math.max(0, Math.floor(Math.min(...session.accuracyTrend.map(p => p.accuracy)) - 2)),
                          max: Math.min(100, Math.ceil(Math.max(...session.accuracyTrend.map(p => p.accuracy)) + 2)),
                        },
                      },
                      options: {
                        plugins: {
                          title: { display: false },
                        },
                        scales: {
                          x: { grid: { display: false } },
                        },
                      },
                    }}
                    labels={chartData.labels}
                  />
                </div>
              </div>
            )}

            <div className="bg-chart-card rounded-xl border border-border p-4">
              <h4 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                Scores
              </h4>
              <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
                {[ ...session.scores ].reverse().map((s, i) => {
                  const prevPp = s.score.previousScore?.change.pp
                  const ppDiff = prevPp != null ? s.score.pp - prevPp : null
                  return (
                    <div
                      key={`${s.score.scoreId}-${i}`}
                      className="flex flex-col gap-0.5 rounded-lg border border-white/3
                      bg-white/1.5 px-3 py-2 text-sm transition-colors hover:bg-white/4 sm:flex-row sm:items-center sm:gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground/50 w-6 shrink-0 text-right text-xs">
                          {session.scores.length - i}
                        </span>
                        <span className="truncate font-medium text-xs text-white/70">
                          <Clock className="mr-1 inline size-3" />
                          {dayjs(s.score.timestamp).utc().format('h:mma')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums sm:ml-auto">
                        {ppDiff != null && (
                          <span className={ppDiff > 0 ? 'text-green-400' : ppDiff < 0 ? 'text-red-400' : 'text-muted-foreground/60'}>
                            {ppDiff > 0 ? <ArrowUp className="inline size-3" /> : ppDiff < 0 ?
                              <ArrowDown className="inline size-3" /> : <Minus className="inline size-3" />}
                            {ppDiff >= 0 ? '+' : ''}{ppDiff.toFixed(1)}
                          </span>
                        )}
                        <span className="text-muted-foreground">{s.score.accuracy.toFixed(1)}%</span>
                        <span className="font-medium">{s.score.pp.toFixed(1)}pp</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {chartData && (
            <div className="bg-chart-card rounded-xl border border-border p-4">
              <h4 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                Session Info
              </h4>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Started: </span>
                  <span className="tabular-nums">{formatSessionDate(session.startTime)} {dayjs(session.startTime).utc().format('h:mma')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ended: </span>
                  <span className="tabular-nums">{formatSessionDate(session.endTime)} {dayjs(session.endTime).utc().format('h:mma')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total notes hit: </span>
                  <span className="tabular-nums">{session.totalNotesHit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Raw PP sum: </span>
                  <span className="tabular-nums">{session.totalPP.toFixed(1)}pp</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueColor,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  tooltip: string;
}) {
  return (
    <SimpleTooltip display={<p className="max-w-[200px] text-wrap text-xs text-gray-400">{tooltip}</p>}>
      <div className="bg-card/90 border-border flex flex-col gap-1.5 rounded-xl border p-4">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {icon}
          <span>{label}</span>
        </div>
        <p className={`text-lg font-bold tabular-nums ${valueColor ?? 'text-white'}`}>{value}</p>
      </div>
    </SimpleTooltip>
  )
}
