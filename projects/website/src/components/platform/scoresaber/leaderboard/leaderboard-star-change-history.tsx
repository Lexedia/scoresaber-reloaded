'use client'

import { buildChartConfig } from '@/common/chart/build-chart-config'
import { Colors } from '@/common/colors'
import GenericChart from '@/components/api/chart/generic-chart'
import { LeaderboardStarChange } from '@ssr/common/schemas/leaderboard/leaderboard-star-change'
import { formatDate, getDaysAgo, timeAgo } from '@ssr/common/utils/time-utils'
import { useMemo } from 'react'

import { ScoreSaberLeaderboard } from '@ssr/common/schemas/scoresaber/leaderboard/leaderboard'

export function LeaderboardStarChangeHistory({
  leaderboard,
  starChangeHistory,
}: {
  leaderboard: ScoreSaberLeaderboard;
  starChangeHistory: LeaderboardStarChange[];
}) {
  const orderedPoints = useMemo(() => {
    const history = starChangeHistory
      .filter(change => change.timestamp.getTime() > 0)
      .toSorted((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    if (history.length > 0) {
      const firstChange = history[0]
      const initialTimestamp = leaderboard.rankedDate ?? new Date(firstChange.timestamp.getTime() - (7 * 24 * 60 * 60 * 1000))

      if (initialTimestamp.getTime() < firstChange.timestamp.getTime()) {
        history.unshift({
          previousStars: firstChange.previousStars,
          newStars: firstChange.previousStars,
          timestamp: initialTimestamp,
        })
      }
    }
    return history
  }, [ starChangeHistory, leaderboard.rankedDate ])

  const labels = orderedPoints.map(change => change.timestamp.getTime())
  const formatRelativeDate = (value: number, withTime: boolean) => {
    const date = new Date(value)
    if (getDaysAgo(date) <= 7) {
      return timeAgo(date, 1)
    }
    return formatDate(date, withTime ? 'Do MMMM, YYYY HH:mm' : 'DD MMMM YYYY')
  }

  const chartConfig = buildChartConfig({
    id: 'leaderboard-star-change-history',
    datasetConfig: [
      {
        field: 'newStars',
        title: 'Stars',
        color: Colors.generic.green,
        axisId: 'y',
        pointRadius: 3,
        labelFormatter: value => `Stars: ${value.toFixed(2)}`,
        axisConfig: {
          display: true,
          displayName: 'Star Rating',
          position: 'left',
          valueFormatter: value => value.toFixed(2),
        },
      },
    ],
    seriesByField: {
      newStars: orderedPoints.map(change => change.newStars),
    },
    options: {
      elements: {
        line: {
          tension: 0.3,
        },
      },
      scales: {
        x: {
          type: 'linear',
          ticks: {
            callback: tickValue => {
              const value = typeof tickValue === 'number' ? tickValue : Number(tickValue)
              return formatRelativeDate(value, false)
            },
          },
        },
      },
    },
  })
  chartConfig.axes.x = {
    display: true,
    displayName: '',
    valueFormatter: (value: number) => formatRelativeDate(value, true),
  }

  return (
    <div className="h-[450px] w-full">
      <GenericChart config={chartConfig} labels={labels} />
    </div>
  )
}
