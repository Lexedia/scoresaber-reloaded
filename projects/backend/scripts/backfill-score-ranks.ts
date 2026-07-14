/**
 * Backfills the `rank` field for all scores stored with rank = -1 (the default before rank tracking).
 *
 * Strategy: for each affected player, paginate their full ScoreSaber score history
 * (sort=recent, limit=100 per page) and, for every score whose scoreId exists in our DB
 * with rank = -1, issue a bulk UPDATE to fix the rank.
 *
 * Usage (from projects/backend):
 *   bun run scripts/backfill-score-ranks.ts
 *   bun run scripts/backfill-score-ranks.ts --dry-run
 *   bun run scripts/backfill-score-ranks.ts --player=76561198854909134
 */
import { CooldownPriority } from '@ssr/common/cooldown'
import Logger from '@ssr/common/logger'
import 'dotenv/config'
import {
  and, eq,
} from 'drizzle-orm'
import { db } from '../src/db'
import { scoreSaberScoresTable } from '../src/db/schema'
import { ScoreSaberApiService } from '../src/service/external/scoresaber-api.service'

const scriptLog = Logger.withTopic('Script: Backfill Score Ranks')

function parseDryRun(argv: string[]): boolean {
  return argv.includes('--dry-run')
}

function parsePlayer(argv: string[]): string | undefined {
  const raw = argv.find(a => a.startsWith('--player='))
  return raw ? raw.slice('--player='.length).trim() || undefined : undefined
}

/** Returns all distinct playerIds who have at least one score with rank = -1. */
async function getAffectedPlayerIds(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ playerId: scoreSaberScoresTable.playerId })
    .from(scoreSaberScoresTable)
    .where(eq(scoreSaberScoresTable.rank, -1))
  return rows.map(r => r.playerId)
}

/**
 * Returns the set of scoreIds for a given player that still have rank = -1 in our DB.
 */
async function getMissingRankScoreIds(playerId: string): Promise<Set<number>> {
  const rows = await db
    .select({ scoreId: scoreSaberScoresTable.scoreId })
    .from(scoreSaberScoresTable)
    .where(and(eq(scoreSaberScoresTable.playerId, playerId), eq(scoreSaberScoresTable.rank, -1)))
  return new Set(rows.map(r => r.scoreId))
}

async function main(): Promise<void> {
  const dryRun = parseDryRun(process.argv)
  const singlePlayer = parsePlayer(process.argv)

  if (dryRun) {
    scriptLog.info('Running in --dry-run mode, no DB writes will occur.')
  }

  const playerIds = singlePlayer ? [ singlePlayer ] : await getAffectedPlayerIds()

  if (playerIds.length === 0) {
    scriptLog.info('No players with rank=-1 scores found. Nothing to do.')
    return
  }

  scriptLog.info(`Found ${playerIds.length} player(s) with rank=-1 scores.`)

  let totalPatched = 0
  let totalFailed = 0

  for (const [
    playerIndex,
    playerId,
  ] of playerIds.entries()) {
    scriptLog.info(`[${playerIndex + 1}/${playerIds.length}] Processing player ${playerId}...`)

    const missingRankIds = await getMissingRankScoreIds(playerId)
    scriptLog.info(`  → ${missingRankIds.size} score(s) with rank=-1`)

    if (missingRankIds.size === 0) {
      continue
    }

    /*
     * Paginate the player's scores from ScoreSaber until we've resolved all missing ranks
     * or run out of pages.
     */
    const updates: {
      scoreId: number;
      rank: number
    }[] = []
    let page = 1

    pageLoop: while (true) {
      const response = await ScoreSaberApiService.lookupPlayerScores({
        playerId,
        sort: 'recent',
        limit: 100,
        page,
        priority: CooldownPriority.LOW,
      })

      if (!response || response.playerScores.length === 0) {
        break
      }

      for (const { score } of response.playerScores) {
        if (missingRankIds.has(Number(score.id))) {
          updates.push({
            scoreId: Number(score.id),
            rank: score.rank,
          })
          missingRankIds.delete(Number(score.id))
        }
      }

      // Stop early if we've resolved all missing scores for this player.
      if (missingRankIds.size === 0) {
        break pageLoop
      }

      const totalPages = Math.ceil(response.metadata.total / response.metadata.itemsPerPage)
      if (page >= totalPages) {
        break
      }

      page++

      // Small delay to be kind to the ScoreSaber API.
      await Bun.sleep(300)
    }

    if (updates.length === 0) {
      scriptLog.warn('  → No scores from ScoreSaber matched the rank=-1 scores in DB. They may be too old to appear in the feed.')
      continue
    }

    scriptLog.info(`  → Patching ${updates.length} score(s)...`)

    if (!dryRun) {
      let playerPatched = 0
      let playerFailed = 0
      for (const { scoreId, rank } of updates) {
        try {
          await db
            .update(scoreSaberScoresTable)
            .set({ rank })
            .where(eq(scoreSaberScoresTable.scoreId, scoreId))
          playerPatched++
        } catch (e) {
          scriptLog.error(`  → Failed to update scoreId=${scoreId}: ${e}`)
          playerFailed++
        }
      }
      totalPatched += playerPatched
      totalFailed += playerFailed
      scriptLog.info(`  → Done. Patched ${playerPatched} score(s), ${playerFailed} failed.`)
    } else {
      scriptLog.info(`  → [dry-run] Would patch: ${updates.map(u => `scoreId=${u.scoreId} rank=${u.rank}`).join(', ')}`)
      totalPatched += updates.length
    }
  }

  scriptLog.info(
    `All done. patched=${totalPatched} failed=${totalFailed}${dryRun ? ' (dry-run)' : ''}`,
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
