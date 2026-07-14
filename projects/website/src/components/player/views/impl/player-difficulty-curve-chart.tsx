'use client'

import { Spinner } from '@/components/spinner'
import { formatPp } from '@ssr/common/utils/number-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import {
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Chart as ChartJS } from 'react-chartjs-2'

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

export default function PlayerDifficultyCurveChart({ playerId }: { playerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [ 'player-difficulty-curve', playerId ],
    queryFn: () => ssrApi.getPlayerDifficultyCurve(playerId),
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (data.data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    )
  }

  const labels = data.data.map(d => d.bin)
  const avgAccuracies = data.data.map(d => Number(d.avgAccuracy.toFixed(2)))
  const avgPps = data.data.map(d => Number(d.avgPp.toFixed(0)))
  const scoreCounts = data.data.map(d => d.scoreCount)
  const maxCount = Math.max(...scoreCounts)

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[350px]">
        <ChartJS
          type="bar"
          data={{
            labels,
            datasets: [
              {
                label: 'Avg Accuracy',
                data: avgAccuracies,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 3,
                yAxisID: 'y',
                order: 2,
              },
              {
                label: 'Avg PP',
                data: avgPps,
                type: 'line',
                borderColor: 'rgb(251, 191, 36)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'rgb(251, 191, 36)',
                fill: true,
                yAxisID: 'y1',
                order: 1,
                tension: 0.3,
              },
              {
                label: 'Score Count',
                data: scoreCounts,
                type: 'bar',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                backgroundColor: (ctx: any) => {
                  const value = ctx.parsed?.y ?? 0
                  const alpha = maxCount > 0 ? 0.1 + ((value / maxCount) * 0.3) : 0.1
                  return `rgba(168, 85, 247, ${alpha})`
                },
                borderColor: 'rgba(168, 85, 247, 0.4)',
                borderWidth: 1,
                borderRadius: 3,
                yAxisID: 'y2',
                order: 3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            scales: {
              x: {
                grid: { color: '#252525' },
                ticks: {
                  color: 'white',
                  maxRotation: 45,
                },
                title: {
                  display: true,
                  text: 'Star Rating',
                  color: 'white',
                },
              },
              y: {
                type: 'linear',
                position: 'left',
                min: 0,
                max: 100,
                grid: { color: '#252525' },
                ticks: {
                  color: 'white',
                  callback: (v) => `${v}%`,
                },
                title: {
                  display: true,
                  text: 'Accuracy',
                  color: 'rgb(59, 130, 246)',
                },
              },
              y1: {
                type: 'linear',
                position: 'right',
                grid: { display: false },
                ticks: {
                  color: 'rgb(251, 191, 36)',
                  callback: (v) => formatPp(Number(v)),
                },
                title: {
                  display: true,
                  text: 'Avg PP',
                  color: 'rgb(251, 191, 36)',
                },
              },
              y2: {
                type: 'linear',
                position: 'right',
                display: false,
                grid: { display: false },
              },
            },
            plugins: {
              legend: {
                position: 'top',
                labels: { color: 'white' },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const label = ctx.dataset.label ?? ''
                    const raw = ctx.raw as number
                    if (ctx.dataset.yAxisID === 'y')
                      return `${label}: ${raw.toFixed(2)}%`
                    if (ctx.dataset.yAxisID === 'y1')
                      return `${label}: ${formatPp(raw)}pp`
                    return `${label}: ${raw}`
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="text-muted-foreground/70 space-y-1 px-1 text-xs">
        <p>
          <span className="inline-block size-2 rounded-sm bg-blue-500/60 align-middle" />
          Accuracy curve — how your accuracy changes as star rating increases. A sharp drop-off shows your plateau.
        </p>
        <p>
          <span className="inline-block size-2 rounded-sm bg-yellow-400 align-middle" />
          Average PP trend — shows which star ranges yield your highest average PP.
        </p>
      </div>
    </div>
  )
}
