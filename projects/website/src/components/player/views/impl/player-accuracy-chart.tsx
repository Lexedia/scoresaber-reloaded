'use client'

import { DatasetConfig } from '@/common/chart/types'
import { Colors } from '@/common/colors'
import GenericPlayerChart from '@/components/player/views/generic-player-chart'
import { ScoreSaberPlayerHistoryEntries } from '@ssr/common/schemas/scoresaber/player/history'
import { isWholeNumber } from '@ssr/common/utils/number-utils'

const datasetConfig: DatasetConfig[] = [
  {
    title: 'Average Accuracy',
    field: 'averageAccuracy',
    color: '#48ff58',
    axisId: 'y2',
    axisConfig: {
      reverse: false,
      display: true,
      hideOnMobile: false,
      displayName: 'Average Accuracy',
      position: 'right',
      valueFormatter: value => {
        if (isWholeNumber(value)) {
          return value.toString()
        }
        return value.toFixed(1)
      },
    },
    labelFormatter: (value: number) => `Average Accuracy: ${value.toFixed(3)}%`,
  },
  {
    title: 'Average Ranked Accuracy',
    field: 'averageRankedAccuracy',
    color: Colors.pp,
    axisId: 'y',
    axisConfig: {
      reverse: false,
      display: true,
      hideOnMobile: false,
      displayName: 'Average Ranked Accuracy',
      position: 'left',
      valueFormatter: value => {
        if (isWholeNumber(value)) {
          return value.toString()
        }
        return value.toFixed(1)
      },
    },
    labelFormatter: (value: number) => `Average Ranked Accuracy: ${value.toFixed(3)}%`,
  },
  {
    title: 'Median Ranked Accuracy',
    field: 'medianRankedAccuracy',
    color: '#ffa500',
    axisId: 'y',
    axisConfig: {
      reverse: false,
      display: false,
      hideOnMobile: false,
      displayName: 'Median Ranked Accuracy',
      position: 'left',
      valueFormatter: value => {
        if (isWholeNumber(value)) {
          return value.toString()
        }
        return value.toFixed(1)
      },
    },
    labelFormatter: (value: number) => `Median Ranked Accuracy: ${value.toFixed(3)}%`,
  },
  {
    title: 'Average Unranked Accuracy',
    field: 'averageUnrankedAccuracy',
    color: '#ff4848', // Changed to red
    axisId: 'y1',
    axisConfig: {
      reverse: false,
      display: false,
      hideOnMobile: false,
      displayName: 'Average Unranked Accuracy',
      position: 'left',
      valueFormatter: value => {
        if (isWholeNumber(value)) {
          return value.toString()
        }
        return value.toFixed(1)
      },
    },
    labelFormatter: (value: number) => `Average Unranked Accuracy: ${value.toFixed(3)}%`,
  },
  {
    title: 'Median Unranked Accuracy',
    field: 'medianUnrankedAccuracy',
    color: '#ff8c8c', // Light red
    axisId: 'y1',
    axisConfig: {
      reverse: false,
      display: false,
      hideOnMobile: false,
      displayName: 'Median Unranked Accuracy',
      position: 'left',
      valueFormatter: value => {
        if (isWholeNumber(value)) {
          return value.toString()
        }
        return value.toFixed(1)
      },
    },
    labelFormatter: (value: number) => `Median Unranked Accuracy: ${value.toFixed(3)}%`,
  },
  {
    title: 'Median Accuracy',
    field: 'medianAccuracy',
    color: '#8cff9a', // Light green
    axisId: 'y2',
    axisConfig: {
      reverse: false,
      display: false,
      hideOnMobile: false,
      displayName: 'Median Accuracy',
      position: 'right',
      valueFormatter: value => {
        if (isWholeNumber(value)) {
          return value.toString()
        }
        return value.toFixed(1)
      },
    },
    labelFormatter: (value: number) => `Median Accuracy: ${value.toFixed(3)}%`,
  },
]

export default function PlayerAccuracyChart({
  statisticHistory,
  daysAmount,
}: {
  statisticHistory: ScoreSaberPlayerHistoryEntries;
  daysAmount: number;
}) {
  return (
    <GenericPlayerChart
      id="player-accuracy-chart"
      statisticHistory={statisticHistory}
      datasetConfig={datasetConfig}
      daysAmount={daysAmount}
    />
  )
}
