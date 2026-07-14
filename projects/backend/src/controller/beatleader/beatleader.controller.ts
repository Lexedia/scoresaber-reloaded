import { NotFoundError } from '@ssr/common/error/not-found-error'
import Logger from '@ssr/common/logger'
import { ScoreStatsResponse } from '@ssr/common/schemas/response/beatleader/score-stats'
import { Elysia, redirect } from 'elysia'
import { z } from 'zod'
import BeatLeaderService from '../../service/beatleader/beatleader.service'
import { PlayerReplayService } from '../../service/player/player-replay.service'

import { BeatLeaderBackfillQueue } from '../../queue/impl/beatleader-backfill-queue'
import { QueueId, QueueManager } from '../../queue/queue-manager'

const beatLeaderControllerLog = Logger.withTopic('BeatLeader Controller')

export default function beatleaderController(app: Elysia) {
  return app.group('/beatleader', app =>
    app
      .post('/backfill-requested', async () => {
        try {
          const queue = QueueManager.getQueue(QueueId.BeatLeaderBackfillQueue) as BeatLeaderBackfillQueue
          const enqueued = await queue.enqueueAllActivePlayers()

          if (enqueued === 0) {
            return {
              success: false,
              message: 'Backfill already running or no active players found.',
            }
          }

          return {
            success: true,
            message: `Backfill started in the background for ${enqueued} players.`,
          }
        } catch (e) {
          beatLeaderControllerLog.error('Error starting backfill: ', e)
          return {
            success: false,
            message: 'Failed to start backfill.',
          }
        }
      })
      .get(
        '/scorestats/:scoreId',
        async ({ params: { scoreId } }): Promise<ScoreStatsResponse> => {
          return BeatLeaderService.getScoresFullScoreStats(scoreId)
        },
        {
          tags: [ 'BeatLeader' ],
          params: z.object({
            scoreId: z.coerce.number(),
          }),
          detail: {
            description: 'Fetch BeatLeader score stats',
          },
        },
      )
      .get(
        '/replay/:scoreId',
        async ({ params: { scoreId } }) => {
          const replayUrl = await PlayerReplayService.getPlayerReplayUrl(scoreId)
          if (!replayUrl) {
            throw new NotFoundError(`Replay not found for score "${scoreId}"`)
          }
          beatLeaderControllerLog.info(`Redirecting to replay URL "${replayUrl}" for score "${scoreId}"`)
          return redirect(replayUrl)
        },
        {
          tags: [ 'BeatLeader' ],
          params: z.object({
            scoreId: z.string().regex(/^\d+\.bsor$/),
          }),
          detail: {
            description: 'Redirect to the raw BeatLeader replay file',
          },
        },
      ),
  )
}
