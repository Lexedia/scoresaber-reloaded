import HMDIcon from '@/components/hmd-icon'
import { PlayerAvatar } from '@/components/ranking/player-avatar'
import SimpleTooltip from '@/components/simple-tooltip'
import { getHMDInfo } from '@ssr/common/hmds'
import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'
import { PlayerScore } from '@ssr/common/score/player-score'
import { formatDate } from '@ssr/common/utils/time-utils'
import { CalendarDays, History } from 'lucide-react'
import Card from '../../../card'
import ScoreSongInfo from '../../score-song-info'
import ReplayButton from './buttons/replay-button'
import ScoreVersionSwitcher from './score-version-switcher'

export default function ScoreDetails({ score: playerScore }: { score: PlayerScore<ScoreSaberScore> }) {
  const { leaderboard } = playerScore
  const score = playerScore.score
  const playerInfo = score.playerInfo!
  const isHistorical = playerScore.isHistorical
  const allPlayerScores = playerScore.allPlayerScores

  return (
    <Card className="overflow-hidden rounded-xl p-0">
      {isHistorical && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 px-4 py-2">
          <History className="size-4 text-amber-500" />
          <span className="text-amber-500 text-sm font-medium">Historical Score</span>
          <span className="text-muted-foreground text-xs">
            This score has been improved upon and is no longer the current score on the leaderboard.
          </span>
        </div>
      )}

      <div className="p-4">
        <ScoreSongInfo
          song={{
            name: leaderboard.fullName,
            authorName: leaderboard.songAuthorName,
            art: leaderboard.songArt,
          }}
          level={{
            authorName: leaderboard.levelAuthorName,
            difficulty: leaderboard.difficulty.difficulty,
          }}
          beatSaverMap={playerScore.beatSaver}
          leaderboardId={leaderboard.id}
        />
      </div>

      <div className="border-border flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:gap-2.5">
        <ReplayButton score={score} />
        {allPlayerScores && allPlayerScores.length > 1 && (
          <ScoreVersionSwitcher
            scoreId={score.scoreId}
            entries={allPlayerScores}
          />
        )}
      </div>

      <div className="bg-accent-deep/90 border-border flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <PlayerAvatar
            profilePicture={playerInfo.avatar}
            name={playerInfo.name ?? ''}
            className="size-14 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a href={`/player/${playerInfo.id}`} className="truncate text-base font-semibold">{playerInfo.name}</a>
              {isHistorical && (
                <SimpleTooltip display={<p>Previous score version</p>}>
                  <span className="bg-amber-500/20 text-amber-500 flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium">
                    <History className="size-2.5" />
                    OLD
                  </span>
                </SimpleTooltip>
              )}
            </div>
            {score.hmd && (
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <HMDIcon hmd={getHMDInfo(score.hmd)} />
                <span>{score.hmd}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-muted-foreground flex shrink-0 items-center gap-2 sm:justify-end">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          <span className="text-sm whitespace-nowrap">
            {formatDate(score.timestamp, 'Do MMMM, YYYY HH:mm')}
          </span>
        </div>
      </div>
    </Card>
  )
}
