'use client'

import { cn } from '@/common/utils'
import SimpleTooltip from '@/components/simple-tooltip'
import { ReplayAnalysis } from '@ssr/common/replay/replay-analysis'
import { Grid3x3 } from 'lucide-react'

type Props = {
  analysis: ReplayAnalysis
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

export default function ReplayMissGrid({ analysis }: Props) {
  const { grid: missGrid, total: totalGrid } = analysis.missGrid

  const maxMiss = Math.max(...missGrid, 1)

  return (
    <div className="flex w-full flex-col items-center gap-4 md:gap-5">
      <div className="flex items-center gap-2">
        <Grid3x3 className="text-muted-foreground h-4 w-4" />
        <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Miss Grid</p>
      </div>
      <div
        className="grid w-full max-w-[540px] gap-3"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const idx = (row * COLS) + col
            const misses = missGrid[idx] ?? 0
            const total = totalGrid[idx] ?? 0
            const pct = total > 0 ? (misses / total) * 100 : 0

            const intensity = misses > 0 ? Math.min(misses / maxMiss, 1) : 0
            const hue = Math.round((1 - intensity) * 120)
            const showAsEmpty = total === 0

            return (
              <SimpleTooltip
                key={idx}
                display={
                  <div className="flex flex-col gap-0.5 text-center">
                    <p className="text-xs text-gray-400">{ROW_LABELS[row]} · {COL_LABELS[col]}</p>
                    {showAsEmpty ? (
                      <p className="text-xs text-gray-500">No notes</p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white">
                          {misses} / {total} misses
                        </p>
                        <p className="text-xs text-gray-400">{pct.toFixed(1)}% miss rate</p>
                      </>
                    )}
                  </div>
                }
                className="cursor-default"
              >
                <div
                  className={cn(
                    'flex h-12 w-full items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-[filter] sm:h-14',
                    showAsEmpty
                      ? 'bg-white/5 text-gray-600'
                      : misses === 0
                        ? 'bg-green-900/40 text-green-400'
                        : 'text-red-200',
                  )}
                  style={!showAsEmpty && misses > 0 ? {
                    backgroundColor: `hsl(${hue}, 40%, 15%)`,
                  } : undefined}
                >
                  {showAsEmpty ? '\u2014' : misses}
                </div>
              </SimpleTooltip>
            )
          }),
        )}
      </div>
    </div>
  )
}
