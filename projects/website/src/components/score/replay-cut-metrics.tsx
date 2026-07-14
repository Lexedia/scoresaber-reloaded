'use client'

import { Colors } from '@/common/colors'
import Card from '@/components/card'
import SimpleTooltip from '@/components/simple-tooltip'
import { CutMetrics, HandCutMetrics } from '@ssr/common/replay/replay-analysis'
import { Info, Swords } from 'lucide-react'

type Props = {
  cutMetrics: HandCutMetrics
}

type RowDef = {
  label: string
  getValue: (m: CutMetrics) => string
  tooltip: string
}

const ROWS: RowDef[] = [
  {
    label: 'Cuts',
    getValue: m => m.count.toString(),
    tooltip: 'Number of cuts',
  },
  {
    label: 'Time Dev',
    getValue: m => `${(m.averageTimeDeviation * 1000).toFixed(1)}ms`,
    tooltip: 'Average time deviation\n(positive = late, negative = early)',
  },
  {
    label: 'Cut Dir Dev',
    getValue: m => `${Math.abs(m.averageCutDirDeviation).toFixed(1)}°`,
    tooltip: 'Average cut direction deviation\nfrom ideal angle (0° = perfect)',
  },
  {
    label: 'Pre Swing',
    getValue: m => m.averageBeforeCutRating.toFixed(3),
    tooltip: 'Average pre-swing rating\n(1.0 = 70 score cap; >1 = overswing)',
  },
  {
    label: 'Post Swing',
    getValue: m => m.averageAfterCutRating.toFixed(3),
    tooltip: 'Average post-swing rating\n(1.0 = 30 score cap; >1 = overswing)',
  },
  {
    label: 'Cut Angle',
    getValue: m => `${Math.abs(m.averageCutAngle).toFixed(1)}°`,
    tooltip: 'Average total swing angle through the note',
  },
  {
    label: 'Saber Speed',
    getValue: m => `${m.averageSaberSpeed.toFixed(1)} m/s`,
    tooltip: 'Average saber speed at time of cut',
  },
  {
    label: 'Center Dist',
    getValue: m => `${(m.averageCutDistanceToCenter * 100).toFixed(1)}cm`,
    tooltip: 'Average distance from center of note\n(0cm = center)',
  },
]

function MetricRow({ row, metrics }: {
  row: RowDef;
  metrics: CutMetrics
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 last:border-none">
      <SimpleTooltip
        display={
          <div className="flex max-w-[400px] flex-col gap-1">
            <p className="text-xs font-semibold text-white">{row.label}</p>
            {row.tooltip.split('\n').map((line, i) => (
              <p key={i} className="text-xs text-gray-400">{line}</p>
            ))}
          </div>
        }
      >
        <span className="text-muted-foreground inline-flex cursor-help items-center gap-1 text-xs">
          {row.label}
          <Info className="size-3 opacity-50" />
        </span>
      </SimpleTooltip>
      <span className="text-xs font-semibold tabular-nums text-white">{row.getValue(metrics)}</span>
    </div>
  )
}

export default function ReplayCutMetrics({ cutMetrics }: Props) {
  const { left, right, overall } = cutMetrics

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Swords className="text-muted-foreground h-4 w-4" />
        <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Cut Metrics</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="rounded-xl p-4">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide" style={{ color: Colors.hands.left }}>
            Left Saber
          </p>
          <div className="flex flex-col">
            {ROWS.map(row => (
              <MetricRow key={row.label} row={row} metrics={left} />
            ))}
          </div>
        </Card>
        <Card className="rounded-xl p-4">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-white">
            Overall
          </p>
          <div className="flex flex-col">
            {ROWS.map(row => (
              <MetricRow key={row.label} row={row} metrics={overall} />
            ))}
          </div>
        </Card>
        <Card className="rounded-xl p-4">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide" style={{ color: Colors.hands.right }}>
            Right Saber
          </p>
          <div className="flex flex-col">
            {ROWS.map(row => (
              <MetricRow key={row.label} row={row} metrics={right} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
