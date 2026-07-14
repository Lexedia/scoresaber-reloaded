import Logger, { type ScopedLogger } from '@ssr/common/logger'
import { ScoreSaberAccountsRepository } from '../../repositories/scoresaber-accounts.repository'
import { PlayerBeatLeaderScoresService } from '../../service/player/player-beatleader-scores.service'
import { PlayerCoreService } from '../../service/player/player-core.service'
import { Queue, QueueItem } from '../queue'
import { QueueId } from '../queue-manager'

/**
 * Queue for running a requested backfill of BeatLeader scores for all active players.
 *
 * Items in the queue are player IDs. The queue is Redis-backed, so if the backend restarts
 * mid-backfill, the remaining players are automatically re-queued and processing resumes.
 *
 * Usage: call `BeatLeaderBackfillQueue.enqueueAllActivePlayers()` to trigger a full backfill.
 */
export class BeatLeaderBackfillQueue extends Queue<QueueItem<string>> {
  private static readonly logger: ScopedLogger = Logger.withTopic('BeatLeader Backfill Queue')

  constructor() {
    super(QueueId.BeatLeaderBackfillQueue, 'fifo', 1)
  }

  protected async processItem(item: QueueItem<string>): Promise<void> {
    const playerId = item.id

    const account = await PlayerCoreService.getAccount(playerId)
    if (!account) {
      BeatLeaderBackfillQueue.logger.warn(`Player "${playerId}" not found, skipping backfill`)
      return
    }

    await PlayerBeatLeaderScoresService.fetchMissingBeatLeaderScores(account, { mode: 'requested' })
  }

  /**
   * Enqueues all active players for a requested backfill.
   * Skips enqueuing if there are already items in the queue (idempotent guard).
   *
   * @returns the number of players enqueued, or 0 if already running
   */
  public async enqueueAllActivePlayers(): Promise<number> {
    const currentSize = await this.getSize()
    if (currentSize > 0 || this.getActiveWorkers() > 0) {
      BeatLeaderBackfillQueue.logger.info(
        `Backfill already in progress (${currentSize} queued, ${this.getActiveWorkers()} active), skipping`,
      )
      return 0
    }

    const players = await ScoreSaberAccountsRepository.selectAllActive()
    if (players.length === 0) {
      BeatLeaderBackfillQueue.logger.info('No active players to backfill')
      return 0
    }

    for (const player of players) {
      await this.add({
        id: player.id,
        data: player.id,
      })
    }

    BeatLeaderBackfillQueue.logger.info(
      `Enqueued ${players.length} players for BeatLeader backfill`,
    )
    return players.length
  }
}
