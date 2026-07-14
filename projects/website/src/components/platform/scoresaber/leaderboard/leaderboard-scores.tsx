'use client'

import CountrySelector from '@/components/country-selector'
import HmdSelector from '@/components/hmd-selector'
import { useLeaderboardFilter } from '@/components/providers/leaderboard/leaderboard-filter-provider'
import ScoreModeSwitcher, { ScoreModeEnum } from '@/components/score/score-mode-switcher'
import { Spinner } from '@/components/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useLeaderboardScores } from '@/hooks/score/use-leaderboard-scores'
import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import { MapCharacteristic } from '@ssr/common/schemas/map/map-characteristic'
import { ScoreSaberLeaderboard } from '@ssr/common/schemas/scoresaber/leaderboard/leaderboard'
import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'
import { getDifficulty } from '@ssr/common/utils/song-utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { parseAsInteger, parseAsStringLiteral, useQueryState } from 'nuqs'
import Card from '../../../card'
import { CharacteristicButton } from '../../../leaderboard/button/characteristic-button'
import { DifficultyButton } from '../../../leaderboard/button/difficulty-button'
import SimplePagination from '../../../simple-pagination'
import ScoreSaberLeaderboardScore from '../score/leaderboard-score'

const SORT_FIELDS = [
  'date',
  'acc',
  'misses',
  'pp',
  'score',
] as const
const SORT_DIRECTIONS = [ 'asc', 'desc' ] as const

const defaultDirectionForField = (field: string): 'asc' | 'desc' =>
  field === 'misses' ? 'asc' : 'desc'

function SortIndicator({ field, currentSort, currentDirection }: {
  field: string;
  currentSort: string | null;
  currentDirection: string | null;
}) {
  if (currentSort !== field) {
    return <ArrowUpDown className="ml-1 inline-block size-3 opacity-30" />
  }
  const dir = currentDirection ?? defaultDirectionForField(field)
  return dir === 'asc'
    ? <ArrowUp className="ml-1 inline-block size-3 text-primary" />
    : <ArrowDown className="ml-1 inline-block size-3 text-primary" />
}

function getScoreId(score: ScoreSaberScore) {
  return score.scoreId + '-' + score.timestamp
}

const SHOWN_CHARACTERISTICS: MapCharacteristic[] = [
  'Standard',
  'OneSaber',
  'NoArrows',
  'Lawless',
  '90Degree',
  '360Degree',
  'Lightshow',
]

export default function LeaderboardScores({ leaderboard }: { leaderboard: ScoreSaberLeaderboard }) {
  const database = useDatabase()
  const mainPlayer = useStableLiveQuery(() => database.getMainPlayer())
  const filter = useLeaderboardFilter()

  const [
    mode,
    setMode,
  ] = useQueryState(
    'mode',
    parseAsStringLiteral<ScoreModeEnum>(Object.values(ScoreModeEnum)).withDefault(ScoreModeEnum.Global),
  )
  const [
    page,
    setPage,
  ] = useQueryState('page', parseAsInteger.withDefault(1))
  const [ highlight ] = useQueryState('highlight')
  const [
    sortField,
    setSortField,
  ] = useQueryState('sort', parseAsStringLiteral<string>(SORT_FIELDS))
  const [
    sortDirection,
    setSortDirection,
  ] = useQueryState('direction', parseAsStringLiteral<string>(SORT_DIRECTIONS))

  const handleSort = (field: string) => {
    if (sortField === field) {
      const newDir = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDir)
    } else {
      setSortField(field)
      setSortDirection(defaultDirectionForField(field))
    }
    setPage(1)
  }

  const {
    data: scores,
    isError,
    isLoading,
    isRefetching,
  } = useLeaderboardScores(
    leaderboard.id,
    mainPlayer?.id ?? '',
    page,
    mode,
    filter.country ?? undefined,
    filter.hmd ?? undefined,
    sortField ?? undefined,
    sortDirection ?? undefined,
  )

  const isFriends = mode === ScoreModeEnum.Friends
  const isLocalOnly = filter.hmd != null
  const noScores =
    isError || (!isLoading && !isRefetching && (!scores || (scores && scores.items.length === 0)))

  const currentCharacteristic = leaderboard.difficulties.find(
    difficulty => difficulty.characteristic === leaderboard.difficulty.characteristic,
  )?.characteristic ?? leaderboard.difficulty.characteristic

  const seenCharacteristics = new Set<MapCharacteristic>()
  const characteristicLeaderboards = leaderboard.difficulties.filter(difficulty => {
    if (
      seenCharacteristics.has(difficulty.characteristic) ||
      !SHOWN_CHARACTERISTICS.includes(difficulty.characteristic)
    ) {
      return false
    }
    seenCharacteristics.add(difficulty.characteristic)
    return true
  })

  const difficultyColor = getDifficulty(leaderboard.difficulty.difficulty).color

  return (
    <div>
      <div className="flex justify-between gap-(--spacing-md)">
        <div className="flex flex-row">
          {leaderboard.difficulties
            .filter(difficulty => difficulty.characteristic === currentCharacteristic)
            .map(difficulty => (
              <DifficultyButton
                key={difficulty.id}
                selectedId={leaderboard.difficulty.id}
                leaderboardDifficulty={difficulty}
              />
            ))}
        </div>

        <div className="flex flex-row">
          {characteristicLeaderboards.map(leaderboardDifficulty => (
            <CharacteristicButton
              key={leaderboardDifficulty.id}
              leaderboardDifficulty={leaderboardDifficulty}
              selectedLeaderboardDifficulty={leaderboard.difficulty}
            />
          ))}
        </div>
      </div>

      <Card
        className="relative w-full gap-(--spacing-md) rounded-t-none border-2"
        style={{
          borderColor: difficultyColor,
        }}
      >
        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-center">
          {/* Equal flex-1 gutters keep ScoreModeSwitcher on the true horizontal center (sm+). */}
          <div className="hidden min-w-0 sm:block sm:flex-1" aria-hidden />
          <div className="flex shrink-0 justify-center">
            <ScoreModeSwitcher initialMode={mode} onModeChange={setMode} />
          </div>
          <div className="flex w-full min-w-0 justify-center sm:flex-1 sm:justify-end gap-2">
            {/* HMD Filter */}
            <HmdSelector
              className="w-full max-w-48"
              clearable
              value={filter.hmd}
              onValueChange={newHmd => {
                filter.setHmd(newHmd)
                setPage(1)
              }}
              placeholder="All headsets"
            />
            {/* Country Filter */}
            <CountrySelector
              className="w-full max-w-48"
              clearable
              prioritizeCountry={mainPlayer?.country}
              value={filter.country}
              onValueChange={newCountry => {
                filter.setCountry(newCountry)
                setPage(1)
              }}
              placeholder="All countries"
            />
          </div>
        </div>

        {isLocalOnly && (
          <div className="bg-muted text-muted-foreground mt-2 w-full rounded-md p-2 text-center text-sm">
            HMD filtering is limited to scores tracked by SSR. Some scores may be missing.
          </div>
        )}

        {isLoading && !scores ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="border-border bg-background/50 relative overflow-x-auto rounded-lg border">
              <table className="table w-full min-w-[800px] table-auto border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="border-border bg-muted/30 border-b">
                    <th className="text-foreground/90 py-3 pr-1 pl-3 font-semibold">Rank</th>
                    <th className="text-foreground/90 px-1 py-3 font-semibold">Player</th>
                    <th
                      className="text-foreground/90 hover:bg-accent/50 cursor-pointer select-none px-1 py-3 text-center font-semibold transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      Date Set
                      <SortIndicator field="date" currentSort={sortField} currentDirection={sortDirection} />
                    </th>
                    <th
                      className="text-foreground/90 hover:bg-accent/50 cursor-pointer select-none px-1 py-3 text-center font-semibold transition-colors"
                      onClick={() => handleSort('acc')}
                    >
                      Accuracy
                      <SortIndicator field="acc" currentSort={sortField} currentDirection={sortDirection} />
                    </th>
                    <th
                      className="text-foreground/90 hover:bg-accent/50 cursor-pointer select-none px-1 py-3 text-center font-semibold transition-colors"
                      onClick={() => handleSort('misses')}
                    >
                      Misses
                      <SortIndicator field="misses" currentSort={sortField} currentDirection={sortDirection} />
                    </th>
                    <th
                      className="text-foreground/90 hover:bg-accent/50 cursor-pointer select-none px-1 py-3 text-center font-semibold transition-colors"
                      onClick={() => handleSort(leaderboard.stars > 0 ? 'pp' : 'score')}
                    >
                      {leaderboard.stars > 0 ? 'PP' : 'Score'}
                      <SortIndicator field={leaderboard.stars > 0 ? 'pp' : 'score'} currentSort={sortField} currentDirection={sortDirection} />
                    </th>
                    <th className="text-foreground/90 px-3 py-3 text-center font-semibold">Mods</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>

                {noScores && (
                  <tbody className="text-center">
                    <tr>
                      <td colSpan={10}>
                        <EmptyState
                          title="No Scores Found"
                          description={
                            isFriends
                              ? 'You or your friends haven\'t played this map yet'
                              : 'No scores were found on this leaderboard or page'
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                )}

                {scores &&
                  scores.items.length > 0 &&
                  scores.items.map((playerScore, index) => (
                    <ScoreSaberLeaderboardScore
                      key={getScoreId(playerScore)}
                      score={playerScore}
                      leaderboard={leaderboard}
                      highlightedPlayerId={highlight ?? undefined}
                      offsetRank={isLocalOnly ? ((page - 1) * scores.metadata.itemsPerPage) + index + 1 : undefined}
                    />
                  ))}
              </table>
            </div>

            {scores && scores.items.length > 0 && (
              <SimplePagination
                page={page}
                totalItems={scores.metadata.totalItems}
                itemsPerPage={scores.metadata.itemsPerPage}
                loadingPage={isLoading || isRefetching ? page : undefined}
                onPageChange={setPage}
                generatePageUrl={page => `/leaderboard/${leaderboard.id}?page=${page}`}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
