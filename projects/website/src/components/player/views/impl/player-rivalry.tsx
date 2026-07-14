'use client'

import { ChartConfig } from '@/common/chart/types'
import { cn } from '@/common/utils'
import GenericChart from '@/components/api/chart/generic-chart-dynamic'
import PlayerSearch from '@/components/player/player-search'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import ScoreSaberPlayer from '@ssr/common/player/impl/scoresaber-player'
import { PlayerScore } from '@ssr/common/schemas/response/score/player-scores'
import { formatNumber, formatPp } from '@ssr/common/utils/number-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import {
  Plus, Swords, Trash2, Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'

dayjs.extend(utc)

const HISTORY_DAYS = 90
const OVERLAP_PAGE_COUNT = 5

type OverlapEntry = {
  leaderboardId: number;
  songName: string;
  difficulty: string;
  playerScore: number;
  playerPp: number;
  rivalScore: number;
  rivalPp: number;
  playerWins: boolean;
}

type Props = {
  player: ScoreSaberPlayer;
}

function StatCard({
  label,
  playerValue,
  rivalValue,
  format,
}: {
  label: string;
  playerValue: number;
  rivalValue: number;
  format: (v: number) => string;
}) {
  const playerWins = label === 'Rank' ? playerValue < rivalValue : playerValue > rivalValue
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', playerWins ? 'bg-green-500' : 'bg-red-500')} />
          <span className="text-sm font-bold">{format(playerValue)}</span>
        </div>
        <span className="text-muted-foreground/50 text-xs">vs</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', !playerWins ? 'bg-green-500' : 'bg-red-500')} />
          <span className="text-sm font-bold">{format(rivalValue)}</span>
        </div>
      </div>
    </div>
  )
}

function OverlapRow({ entry }: { entry: OverlapEntry }) {
  const shortDiff = entry.difficulty === 'ExpertPlus' ? 'Expert+' : entry.difficulty
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/2 px-4 py-2.5 text-sm transition-colors hover:bg-white/5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{entry.songName}</span>
        <span className="text-muted-foreground shrink-0 text-xs">{shortDiff}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-1.5 rounded-full', entry.playerWins ? 'bg-green-500' : 'bg-red-500')} />
          <span className="tabular-nums">{formatPp(entry.playerPp)}</span>
        </div>
        <span className="text-muted-foreground/50 text-xs">vs</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('size-1.5 rounded-full', !entry.playerWins ? 'bg-green-500' : 'bg-red-500')} />
          <span className="tabular-nums">{formatPp(entry.rivalPp)}</span>
        </div>
        <span className={cn('ml-1 shrink-0 text-xs font-bold', entry.playerWins ? 'text-green-400' : 'text-red-400')}>
          {entry.playerWins ? 'W' : 'L'}
        </span>
      </div>
    </div>
  )
}

export default function PlayerRivalry({ player }: Props) {
  const database = useDatabase()
  const [ showAddRival, setShowAddRival ] = useState(false)
  const [ activeRivalId, setActiveRivalId ] = useState<string | undefined>()

  const rivals = useStableLiveQuery(() => database.getRivals())
  const rivalPlayers = rivals ?? []
  const resolvedRivalId = activeRivalId ?? rivalPlayers[0]?.id
  const activeRival = rivalPlayers.find(r => r.id === resolvedRivalId)

  const { data: rivalDetail } = useQuery({
    queryKey: [ 'rival-detail', resolvedRivalId ],
    queryFn: () => resolvedRivalId ? ssrApi.getScoreSaberPlayer(resolvedRivalId, 'full') : undefined,
    enabled: !!resolvedRivalId,
  })

  const { data: playerHistory } = useQuery({
    queryKey: [ 'player-history-rivalry', player.id, HISTORY_DAYS ],
    queryFn: () => ssrApi.getPlayerStatisticHistory(player.id, HISTORY_DAYS),
    enabled: !!resolvedRivalId,
  })

  const { data: rivalHistory } = useQuery({
    queryKey: [ 'rival-history', resolvedRivalId, HISTORY_DAYS ],
    queryFn: () => resolvedRivalId ? ssrApi.getPlayerStatisticHistory(resolvedRivalId, HISTORY_DAYS) : undefined,
    enabled: !!resolvedRivalId,
  })

  const { data: overlaps, isLoading: overlapsLoading } = useQuery({
    queryKey: [ 'overlapping-scores', player.id, resolvedRivalId ],
    queryFn: async () => {
      if (!resolvedRivalId)
        return []
      const pages = await Promise.all(
        Array.from({ length: OVERLAP_PAGE_COUNT }, (_, i) =>
          ssrApi.fetchPlayerScoreSaberScores(player.id, i + 1, 'pp', 'desc', {
            playerIds: [ resolvedRivalId ],
          }),
        ),
      )

      const allItems = pages.flatMap(p => p?.items ?? [])
      const grouped = new Map<number, PlayerScore[]>()
      for (const item of allItems) {
        const lbId = item.score.leaderboardId
        if (!grouped.has(lbId))
          grouped.set(lbId, [])
        grouped.get(lbId)!.push(item)
      }

      const overlaps: OverlapEntry[] = []
      for (const [ lbId, items ] of grouped) {
        const playerScore = items.find(i => i.score.playerId === player.id)
        const rivalScore = items.find(i => i.score.playerId === resolvedRivalId)
        if (playerScore && rivalScore) {
          overlaps.push({
            leaderboardId: lbId,
            songName: playerScore.leaderboard.songName,
            difficulty: playerScore.leaderboard.difficulty.difficulty,
            playerScore: playerScore.score.score,
            playerPp: playerScore.score.pp,
            rivalScore: rivalScore.score.score,
            rivalPp: rivalScore.score.pp,
            playerWins: playerScore.score.pp > rivalScore.score.pp,
          })
        }
      }

      return overlaps.sort((a, b) => b.playerPp - a.playerPp)
    },
    enabled: !!resolvedRivalId,
  })

  const playerWinsCount = overlaps?.filter(o => o.playerWins).length ?? 0
  const rivalWinsCount = (overlaps?.length ?? 0) - playerWinsCount

  const ppChartData = useMemo(() => {
    if (!playerHistory || !rivalHistory)
      return undefined
    const allDates = [ ...new Set([ ...Object.keys(playerHistory), ...Object.keys(rivalHistory) ]) ]
      .sort((a, b) => dayjs.utc(a).valueOf() - dayjs.utc(b).valueOf())
    if (allDates.length === 0)
      return undefined

    const buildSeries = (history: Record<string, { pp?: number | null } | undefined>) => {
      const data = allDates.map(d => history[d]?.pp ?? null)
      let last: number | null = null
      for (let i = 0; i < data.length; i++) {
        if (data[i] !== null)
          last = data[i]
        else if (last !== null)
          data[i] = last
      }
      return data
    }

    return {
      labels: allDates,
      config: {
        id: 'rivalry-pp',
        datasets: [
          {
            label: player.name,
            data: buildSeries(playerHistory),
            color: '#3b82f6',
            axisId: 'y',
          },
          {
            label: activeRival?.name ?? 'Rival',
            data: buildSeries(rivalHistory),
            color: '#ef4444',
            axisId: 'y',
          },
        ],
        axes: {
          x: {
            display: true,
            displayName: 'Date',
          },
          y: {
            display: true,
            displayName: 'PP',
            position: 'left',
            valueFormatter: (v: number) => v.toFixed(0),
          },
        },
        options: {
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 15,
                autoSkip: true,
              },
            },
          },
        },
      } satisfies ChartConfig,
    }
  }, [
    playerHistory,
    rivalHistory,
    activeRival,
    player.name,
  ])

  if (rivalPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Swords className="text-muted-foreground/30 size-12" />
        <p className="text-muted-foreground text-sm">No rivals set yet</p>
        <Button onClick={() => setShowAddRival(true)} size="sm">
          <Plus className="mr-1 size-4" />
          Add Rival
        </Button>
        <PlayerSearch
          isOpen={showAddRival}
          onOpenChange={setShowAddRival}
          onPlayerSelect={async rival => {
            await database.addRival(rival.id)
          }}
          excludePlayerIds={[ player.id ]}
          filterFn={p => p.rank > 0 && !p.inactive}
          placeholder="Search for a rival player..."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Swords className="size-5 text-white/60" />
          <div className="flex flex-wrap items-center gap-1.5">
            {rivalPlayers.map(r => (
              <Button
                key={r.id}
                onClick={() => setActiveRivalId(r.id)}
                variant={r.id === resolvedRivalId ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <span className="truncate max-w-24">{r.name}</span>
                <span
                  onClick={e => {
                    e.stopPropagation()
                    database.removeRival(r.id)
                    if (activeRivalId === r.id)
                      setActiveRivalId(undefined)
                  }}
                  className="cursor-pointer text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="size-3" />
                </span>
              </Button>
            ))}
            <Button
              onClick={() => setShowAddRival(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {activeRival && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard
              label="PP"
              playerValue={player.pp}
              rivalValue={activeRival.pp}
              format={v => formatNumber(v, 'pp')}
            />
            <StatCard
              label="Rank"
              playerValue={player.rank}
              rivalValue={activeRival.rank}
              format={v => `#${formatNumber(v, 'number')}`}
            />
            <StatCard
              label="Country Rank"
              playerValue={player.countryRank}
              rivalValue={activeRival.countryRank}
              format={v => `#${formatNumber(v, 'number')}`}
            />
            <StatCard
              label="Avg Accuracy"
              playerValue={player.statistics?.averageAccuracy ?? 0}
              rivalValue={rivalDetail?.statistics?.averageAccuracy ?? 0}
              format={v => `${v.toFixed(2)}%`}
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/2 p-2">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                PP Progression
              </span>
              <span className="text-muted-foreground/50 text-[10px]">Last {HISTORY_DAYS} days</span>
            </div>
            {ppChartData ? (
              <div className="h-64">
                <GenericChart config={ppChartData.config} labels={ppChartData.labels} />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/2 p-2">
            <div className="mb-2 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-white/60" />
                <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Overlapping Scores
                </span>
              </div>
              <span className="text-muted-foreground/70 text-xs">
                {overlapsLoading ? (
                  'Loading...'
                ) : overlaps ? (
                  <>
                    <span className="text-green-400 font-bold">{playerWinsCount}</span>
                    <span className="text-muted-foreground/50 mx-1">-</span>
                    <span className="text-red-400 font-bold">{rivalWinsCount}</span>
                  </>
                ) : null}
              </span>
            </div>
            {overlapsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner />
              </div>
            ) : overlaps && overlaps.length > 0 ? (
              <div className="flex flex-col gap-1">
                {overlaps.slice(0, 30).map(entry => (
                  <OverlapRow key={entry.leaderboardId} entry={entry} />
                ))}
                {overlaps.length > 30 && (
                  <p className="text-muted-foreground/50 py-2 text-center text-xs">
                    Showing top 30 of {overlaps.length} overlapping scores
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground/50 text-sm">No overlapping scores found</p>
              </div>
            )}
          </div>
        </>
      )}

      <PlayerSearch
        isOpen={showAddRival}
        onOpenChange={setShowAddRival}
        onPlayerSelect={async rival => {
          await database.addRival(rival.id)
        }}
        excludePlayerIds={[ player.id, ...rivalPlayers.map(r => r.id) ]}
        filterFn={p => p.rank > 0 && !p.inactive}
        placeholder="Search for a rival player..."
      />
    </div>
  )
}
