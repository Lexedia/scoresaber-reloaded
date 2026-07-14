'use client'

import { HistoryMode } from '@/common/player/history-mode'
import Card from '@/components/card'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/contexts/viewport-context'
import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import { GlobeAmericasIcon } from '@heroicons/react/24/solid'
import ScoreSaberPlayer from '@ssr/common/player/impl/scoresaber-player'
import { ScoreSaberPlayerHistoryEntries } from '@ssr/common/schemas/scoresaber/player/history'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import {
  Award, CalculatorIcon, ChartBarIcon,
  History, LineChart, SlidersHorizontal,
  SwordIcon, Swords, TrendingUpIcon, TriangleIcon,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { ReactElement, useState } from 'react'
import { cn } from '../../../common/utils'
import PlayerRankingsButton from '../buttons/player-rankings-button'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'

function ChartPanelSkeleton() {
  return (
    <div className="flex h-[400px] items-center justify-center">
      <Spinner />
    </div>
  )
}

const PlayerSimpleRankingChart = dynamic(() => import('./impl/player-simple-ranking-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerAdvancedRankingChart = dynamic(() => import('./impl/player-advanced-ranking-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerAccuracyChart = dynamic(() => import('./impl/player-accuracy-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerScoresChart = dynamic(() => import('./impl/player-scores-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const ScoresGraphChart = dynamic(() => import('./impl/scores-graph-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const SkillTriangleChart = dynamic(() => import('./impl/skill-triangle-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlusPpCalculator = dynamic(() => import('./impl/plus-pp-calculator'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerAccuracyBadgesChart = dynamic(() => import('./impl/player-accuracy-badges-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerPpSimulator = dynamic(() => import('./impl/player-pp-simulator').then(mod => mod.PlayerPpSimulator), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerRecommender = dynamic(() => import('./impl/player-recommender').then(mod => mod.PlayerRecommender), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerSessionAnalysis = dynamic(() => import('./impl/player-session-analysis'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerRivalry = dynamic(() => import('./impl/player-rivalry'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerDifficultyCurveChart = dynamic(() => import('./impl/player-difficulty-curve-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})
const PlayerSkillBreakdownChart = dynamic(() => import('./impl/player-skill-breakdown-chart'), {
  ssr: false,
  loading: ChartPanelSkeleton,
})

const SINCE_TRACKED_DAYS = -1

const DATE_PRESETS = [
  {
    label: 'Last 50 Days',
    value: 50,
  },
  {
    label: 'Last 90 Days',
    value: 90,
  },
  {
    label: 'Last 180 Days',
    value: 180,
  },
  {
    label: 'Last 365 Days',
    value: 365,
  },
  {
    label: 'Since Tracked',
    value: SINCE_TRACKED_DAYS,
  },
  {
    label: 'Custom Range',
    value: 'custom',
  },
] as const

const DEFAULT_DAYS_AGO = 50

type ViewMeta = {
  index: number;
  label: string;
  showDateRangeSelector: boolean;
  isChart: boolean;
  icon: React.ElementType;
}

const VIEW_METAS: ViewMeta[] = [
  {
    index: 0,
    label: 'Ranking',
    icon: GlobeAmericasIcon,
    showDateRangeSelector: true,
    isChart: true,
  },
  {
    index: 1,
    label: 'Accuracy',
    icon: TrendingUpIcon,
    showDateRangeSelector: true,
    isChart: true,
  },
  {
    index: 2,
    label: 'Scores',
    icon: SwordIcon,
    showDateRangeSelector: true,
    isChart: true,
  },
  {
    index: 3,
    label: 'Scores Graph',
    icon: ChartBarIcon,
    showDateRangeSelector: false,
    isChart: true,
  },
  {
    index: 4,
    label: 'Skill Triangle',
    icon: TriangleIcon,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 5,
    label: 'PP Calculator',
    icon: CalculatorIcon,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 6,
    label: 'Acc Badges',
    icon: Award,
    showDateRangeSelector: true,
    isChart: true,
  },
  {
    index: 7,
    label: 'PP Simulator',
    icon: CalculatorIcon,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 8,
    label: 'Map Recommendations',
    icon: SwordIcon,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 9,
    label: 'Session Analysis',
    icon: History,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 10,
    label: 'Rivalries',
    icon: Swords,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 11,
    label: 'Difficulty Curve',
    icon: LineChart,
    showDateRangeSelector: false,
    isChart: false,
  },
  {
    index: 12,
    label: 'Skill Breakdown',
    icon: SlidersHorizontal,
    showDateRangeSelector: false,
    isChart: false,
  },
]

function PlayerViewPanel({
  viewIndex,
  player,
  statisticHistory,
  actualDaysAgo,
  historyMode,
}: {
  viewIndex: number;
  player: ScoreSaberPlayer;
  statisticHistory: ScoreSaberPlayerHistoryEntries;
  actualDaysAgo: number;
  historyMode: HistoryMode;
}): ReactElement {
  switch (viewIndex) {
    case 0:
      if (historyMode === HistoryMode.ADVANCED) {
        return <PlayerAdvancedRankingChart statisticHistory={statisticHistory} daysAmount={actualDaysAgo} />
      }
      return <PlayerSimpleRankingChart statisticHistory={statisticHistory} daysAmount={actualDaysAgo} />
    case 1:
      return <PlayerAccuracyChart statisticHistory={statisticHistory} daysAmount={actualDaysAgo} />
    case 2:
      return <PlayerScoresChart statisticHistory={statisticHistory} daysAmount={actualDaysAgo} />
    case 3:
      return <ScoresGraphChart player={player} />
    case 4:
      return <SkillTriangleChart player={player} />
    case 5:
      return <PlusPpCalculator player={player} />
    case 6:
      return <PlayerAccuracyBadgesChart statisticHistory={statisticHistory} daysAmount={actualDaysAgo} />
    case 7:
      return <PlayerPpSimulator playerId={player.id} playerPp={player.pp} />
    case 8:
      return <PlayerRecommender playerId={player.id} />
    case 9:
      return <PlayerSessionAnalysis player={player} />
    case 10:
      return <PlayerRivalry player={player} />
    case 11:
      return <PlayerDifficultyCurveChart playerId={player.id} />
    case 12:
      return <PlayerSkillBreakdownChart playerId={player.id} />
    default:
      return <PlayerSimpleRankingChart statisticHistory={statisticHistory} daysAmount={actualDaysAgo} />
  }
}

function ViewSelector({
  views,
  selectedView,
  onViewSelect,
}: {
  views: ViewMeta[];
  selectedView: ViewMeta;
  onViewSelect: (view: ViewMeta) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {views.map(view => (
        <Button
          key={view.index}
          onClick={() => onViewSelect(view)}
          variant={view.index === selectedView.index ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
        >
          <view.icon className="hidden size-4 md:block" />
          <span>{view.label}</span>
        </Button>
      ))}
    </div>
  )
}

export type DateRangeState =
  | {
    mode: 'preset';
    daysAgo: number
  }
  | {
    mode: 'custom';
    range: DateRange | undefined
  }

function DateRangeSelector({
  state,
  onChange,
}: {
  state: DateRangeState;
  onChange: (state: DateRangeState) => void;
}) {
  const isCustom = state.mode === 'custom'
  const selectValue = isCustom ? 'custom' : state.daysAgo.toString()

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <Select
        value={selectValue}
        onValueChange={value => {
          if (value === 'custom') {
            onChange({
              mode: 'custom',
              range: undefined,
            })
          } else {
            onChange({
              mode: 'preset',
              daysAgo: parseInt(value, 10),
            })
          }
        }}
      >
        <SelectTrigger className="w-[180px] cursor-pointer">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map(preset => (
            <SelectItem key={preset.value} value={preset.value.toString()} className="cursor-pointer">
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <DatePickerWithRange
          date={state.range}
          onDateChange={range => onChange({
            mode: 'custom',
            range,
          })}
        />
      )}
    </div>
  )
}

export default function PlayerViews({ player }: { player: ScoreSaberPlayer }) {
  const isMobile = useIsMobile('2xl')
  const database = useDatabase()
  const mainPlayerId = useStableLiveQuery(() => database.getMainPlayerId())

  const enabledViews = useStableLiveQuery(() => database.getEnabledPlayerViews())
  const historyMode = useStableLiveQuery(() => database.getHistoryMode())

  const [
    selectedViewIndex,
    setSelectedViewIndex,
  ] = useState(-1)
  const [
    dateRangeState,
    setDateRangeState,
  ] = useState<DateRangeState>({
    mode: 'preset',
    daysAgo: DEFAULT_DAYS_AGO,
  })

  const availableViews = VIEW_METAS.filter(v => {
    if (!(enabledViews?.includes(v.index) ?? true)) {
      return false
    }
    if (v.index === 10 && mainPlayerId && player.id !== mainPlayerId) {
      return false
    }
    return true
  })
  const activeViewIndex = selectedViewIndex === -1 ? (availableViews[0]?.index ?? 0) : selectedViewIndex
  const selectedView = availableViews.find(v => v.index === activeViewIndex) ?? VIEW_METAS[0]

  const fromIso = dateRangeState.mode === 'custom' && dateRangeState.range?.from
    ? format(dateRangeState.range.from, 'yyyy-MM-dd') : undefined
  const toIso = dateRangeState.mode === 'custom' && dateRangeState.range?.to
    ? format(dateRangeState.range.to, 'yyyy-MM-dd') : undefined
  const queryDaysAgo = dateRangeState.mode === 'preset' ? dateRangeState.daysAgo : -1

  /*
   * For charts that just expect a single number (daysAmount) for simple backward compat logic:
   * (We pass -1 if custom so it can just plot everything provided by the API)
   */
  const actualDaysAgo = dateRangeState.mode === 'preset' ? dateRangeState.daysAgo : -1

  const { data: statisticHistory } = useQuery({
    queryKey: [
      'player-statistic-history',
      player.id,
      queryDaysAgo,
      fromIso,
      toIso,
    ],
    queryFn: () => ssrApi.getPlayerStatisticHistory(player.id, queryDaysAgo, fromIso, toIso),
    placeholderData: data => data,
    enabled: dateRangeState.mode === 'preset' || (dateRangeState.mode === 'custom' && !!dateRangeState.range?.from && !!dateRangeState.range?.to),
  })

  return (
    <div className="flex flex-col gap-(--spacing-md)">
      <ViewSelector
        views={availableViews}
        selectedView={selectedView}
        onViewSelect={view => setSelectedViewIndex(view.index)}
      />

      {statisticHistory && historyMode !== undefined ? (
        <Card className={cn('bg-chart-card', selectedView.isChart ? 'p-2.5' : '')}>
          <PlayerViewPanel
            viewIndex={selectedView.index}
            player={player}
            statisticHistory={statisticHistory}
            actualDaysAgo={actualDaysAgo}
            historyMode={historyMode}
          />
        </Card>
      ) : (
        <Card className="bg-chart-card p-2.5">
          <div className="flex h-[400px] items-center justify-center">
            <Spinner />
          </div>
        </Card>
      )}

      {selectedView.showDateRangeSelector && (
        <div className="flex items-center justify-between gap-2">
          <DateRangeSelector state={dateRangeState} onChange={setDateRangeState} />
          {isMobile && <PlayerRankingsButton player={player} />}
        </div>
      )}
    </div>
  )
}
