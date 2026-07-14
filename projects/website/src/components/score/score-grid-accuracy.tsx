'use client'

import { cn } from '@/common/utils'
import SimpleTooltip from '@/components/simple-tooltip'
import { ScoreStatsToken } from '@ssr/common/schemas/beatleader/tokens/score-stats/score-stats'
import { Grid3x3 } from 'lucide-react'

type ScoreGridAccuracyProps = {
  scoreStats: ScoreStatsToken
}

const COLS = 4
const ROWS = 3

const ROW_LABELS = [ 'Top', 'Middle', 'Bottom' ] as const
const COL_LABELS = [
  'Left',
  'Center-Left',
  'Center-Right',
  'Right',
] as const

/**
 * Returns dynamic text and background colors based on accuracy.
 */
function getAccuracyColors(value: number, min: number, max: number) {
  if (max === min) {
    return {
      bg: 'hsl(60, 40%, 15%)',
      text: 'hsl(60, 80%, 60%)',
    }
  }
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const hue = Math.round(t * 120) // 0 = red, 120 = green
  return {
    bg: `hsl(${hue}, 40%, 15%)`,
    text: `hsl(${hue}, 80%, 60%)`,
  }
}

export default function ScoreGridAccuracy({ scoreStats }: ScoreGridAccuracyProps) {
  const { gridAcc } = scoreStats.accuracyTracker

  // Filter out zero / unplayed cells for meaningful color scaling
  const played = gridAcc.filter(v => v > 0)
  if (played.length === 0)
    return null

  const min = Math.min(...played)
  const max = Math.max(...played)

  return (
    <div className="flex w-full flex-col items-center gap-4 md:gap-5">
      <div className="flex items-center gap-2">
        <Grid3x3 className="text-muted-foreground h-4 w-4" />
        <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Grid Accuracy</p>
      </div>
      <div
        className="grid w-full max-w-[540px] gap-3"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const idx = (row * COLS) + col
            const value = gridAcc[idx] ?? 0

            const isEmpty = value === 0
            const colors = isEmpty ? undefined : getAccuracyColors(value, min, max)

            const tooltipContent = isEmpty
              ? (
                <p className="text-xs text-gray-400">No notes in this cell</p>
              )
              : (
                <div className="flex flex-col gap-0.5 text-center">
                  <p className="text-xs text-gray-400">{ROW_LABELS[row]} · {COL_LABELS[col]}</p>
                  <p className="text-sm font-bold text-white">{value.toFixed(2)}</p>
                </div>
              )

            return (
              <SimpleTooltip
                key={idx}
                display={tooltipContent}
                className="cursor-default"
              >
                <div
                  className={cn(
                    'flex h-12 w-full items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-[filter] hover:brightness-125 sm:h-14',
                    isEmpty ? 'bg-white/5 text-gray-600' : '',
                  )}
                  style={colors ? {
                    backgroundColor: colors.bg,
                    color: colors.text,
                  } : undefined}
                >
                  {isEmpty ? '—' : value.toFixed(1)}
                </div>
              </SimpleTooltip>
            )
          }),
        )}
      </div>
    </div>
  )
}
