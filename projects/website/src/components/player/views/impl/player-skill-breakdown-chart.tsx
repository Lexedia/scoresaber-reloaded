'use client'

import { Spinner } from '@/components/spinner'
import { formatNumber, formatPp } from '@ssr/common/utils/number-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function PlayerSkillBreakdownChart({ playerId }: { playerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [ 'player-skill-breakdown', playerId ],
    queryFn: () => ssrApi.getPlayerSkillBreakdown(playerId),
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

  const topCategories = data.data.slice(0, 20)
  const labels = topCategories.map(d => d.label)
  const totalPps = topCategories.map(d => Number(d.totalPp.toFixed(0)))
  const maxPp = Math.max(...totalPps)

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[450px]">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'Total PP',
                data: totalPps,
                backgroundColor: (ctx) => {
                  const value = ctx.parsed?.x ?? 0
                  const intensity = maxPp > 0 ? value / maxPp : 0
                  return `rgba(59, 130, 246, ${0.3 + (intensity * 0.5)})`
                },
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 3,
                yAxisID: 'y',
              },
            ],
          }}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                position: 'top',
                grid: { color: '#252525' },
                ticks: {
                  color: 'white',
                  callback: (v) => formatPp(Number(v)),
                },
                title: {
                  display: true,
                  text: 'Total PP',
                  color: 'white',
                },
              },
              y: {
                grid: { display: false },
                ticks: {
                  color: 'white',
                  font: { size: 11 },
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const index = ctx.dataIndex
                    const cat = topCategories[index]
                    return [
                      `Total PP: ${formatPp(cat.totalPp)}pp`,
                      `Avg Accuracy: ${cat.avgAccuracy.toFixed(2)}%`,
                      `Avg Stars: ${cat.avgStars.toFixed(2)}⭐`,
                      `Scores: ${formatNumber(cat.scoreCount, 'number')}`,
                    ]
                  },
                },
              },
            },
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {topCategories.slice(0, 6).map(cat => (
          <div
            key={cat.label}
            className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <p className="text-sm font-medium">{cat.label}</p>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{formatPp(cat.totalPp)}pp</span>
              <span>{cat.avgAccuracy.toFixed(2)}%</span>
              <span>{cat.avgStars.toFixed(1)}⭐</span>
              <span>{formatNumber(cat.scoreCount, 'number')} scores</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
