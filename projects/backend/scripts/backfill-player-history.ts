import { ScoreSaberPlayerHistory, ScoreSaberPlayerHistoryEntries } from '@ssr/common/schemas/scoresaber/player/history'
import { getMidnightAlignedDate } from '@ssr/common/utils/time-utils'
import { parseArgs } from 'util'
import { PlayerHistoryRepository } from '../src/repositories/player-history.repository'
import { ScoreSaberAccountsRepository } from '../src/repositories/scoresaber-accounts.repository'

async function backfillPlayer(playerId: string) {
  console.log(`\n=== Backfilling player ${playerId} ===`)

  try {
    console.log('Fetching history from main instance...')
    const response = await fetch(`https://ssr-api.fascinated.cc/player/history/${playerId}?count=-1`, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch history from main instance: ${response.status} ${response.statusText}`)
    }

    const historyEntries = await response.json() as ScoreSaberPlayerHistoryEntries

    const rows = Object.entries(historyEntries).map(([ dateStr, stats ]) => {
      // Parse date and align to midnight to match DB standard
      const date = getMidnightAlignedDate(new Date(dateStr))

      return {
        playerId,
        date,
        ...stats,
      } as Partial<ScoreSaberPlayerHistory> & {
        playerId: string;
        date: Date
      }
    })

    if (rows.length === 0) {
      console.log(`No history entries found for player ${playerId}.`)
      return
    }

    console.log(`Fetched ${rows.length} days of history. Upserting into database...`)

    /*
     * Chunk the inserts to avoid postgres parameter limit (65535)
     * 1 row has ~25 columns, so ~2500 rows per chunk is safe
     */
    const chunkSize = 1000
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      await PlayerHistoryRepository.bulkUpsertHistory(chunk)
      console.log(`  -> Upserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(rows.length / chunkSize)} (${chunk.length} rows)`)
    }

    console.log(`Successfully backfilled history for ${playerId}!`)
  } catch (e) {
    console.error(`Failed to backfill player ${playerId}:`, e)
  }
}

async function main() {
  const { positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
  })

  // If IDs were provided via CLI arguments, use those
  if (positionals.length > 0) {
    for (const playerId of positionals) {
      await backfillPlayer(playerId)
    }
  } else {
    // Otherwise, fetch all active players from the database and prompt
    console.log('No player IDs provided. Fetching all active players...')

    const activePlayers = await ScoreSaberAccountsRepository.selectAllActive()
    console.log(`Found ${activePlayers.length} active players. Backfilling...`)

    for (let i = 0; i < activePlayers.length; i++) {
      const player = activePlayers[i]
      console.log(`\n[${i + 1}/${activePlayers.length}]`)
      await backfillPlayer(player.id)
    }
  }

  process.exit(0)
}

main().catch(console.error)
