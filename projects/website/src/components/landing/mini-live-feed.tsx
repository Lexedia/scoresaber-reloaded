'use client'

import { env } from '@ssr/common/env'
import Logger from '@ssr/common/logger'
import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'
import { PlayerScore } from '@ssr/common/score/player-score'
import { parseDate } from '@ssr/common/utils/time-utils'
import { useCallback, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { Spinner } from '../spinner'

const MAX_ITEMS = 5

function sortByNewestFirst(a: PlayerScore<ScoreSaberScore>, b: PlayerScore<ScoreSaberScore>): number {
  return (
    parseDate(b.score.timestamp.toString()).getTime() - parseDate(a.score.timestamp.toString()).getTime()
  )
}

export default function MiniLiveFeed() {
  const [ scores, setScores ] = useState<PlayerScore<ScoreSaberScore>[]>([])

  const onMessage = useCallback((event: WebSocketEventMap['message']) => {
    if (typeof event.data !== 'string')
      return
    let parsed: PlayerScore<ScoreSaberScore>
    try { parsed = JSON.parse(event.data) as PlayerScore<ScoreSaberScore> } catch { return }
    if (!parsed.leaderboard || !parsed.score) { Logger.error('Invalid data:', parsed); return }

    setScores(prev => {
      const id = parsed.score.scoreId
      const withoutDup = prev.filter(s => s.score.scoreId !== id)
      return [ ...withoutDup, parsed ].sort(sortByNewestFirst).slice(0, MAX_ITEMS)
    })
  }, [])

  const { readyState } = useWebSocket<PlayerScore<ScoreSaberScore>>(
    `${env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/score`,
    {
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      shouldReconnect: () => true,
      onMessage,
    },
  )

  const connected = readyState === ReadyState.OPEN

  return (
    <div className="border-border/50 bg-card/50 rounded-2xl border p-(--spacing-xl)">
      <div className="mb-(--spacing-lg) flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Live Scores</h2>
          <p className="text-muted-foreground text-xs">New scores as they happen</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
          connected
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
        }`}>
          <span className={`size-1.5 rounded-full ${
            connected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'animate-pulse bg-amber-500'
          }`} />
          {connected ? 'Live' : 'Connecting'}
        </span>
      </div>

      {scores.length === 0 ? (
        <div className="flex items-center justify-center py-(--spacing-xl)">
          {connected ? (
            <p className="text-muted-foreground/50 text-xs">Waiting for scores...</p>
          ) : (
            <Spinner />
          )}
        </div>
      ) : (
        <div className="-mx-(--spacing-xl) flex flex-col divide-y divide-white/3">
          {scores.slice(0, MAX_ITEMS).map((s, i) => {
            const playerName = s.score.playerInfo?.name ?? 'Unknown'
            const songName = s.leaderboard?.songName ?? 'Unknown song'
            return (
              <div key={s.score.scoreId} className="flex items-center gap-3 px-(--spacing-xl) py-2.5 transition-colors hover:bg-white/1.5">
                <span className="text-muted-foreground/30 w-4 text-right text-[10px] tabular-nums">{i + 1}</span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium">{playerName}</span>
                  <span className="text-muted-foreground/50 hidden truncate text-xs sm:block">{songName}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 tabular-nums text-xs">
                  <span className="text-muted-foreground">{s.score.accuracy.toFixed(1)}%</span>
                  <span className="w-14 text-right font-medium">{s.score.pp.toFixed(1)}pp</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
