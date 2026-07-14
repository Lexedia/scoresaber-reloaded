import { chunkArray } from '@ssr/common/utils/utils'
import { isNull } from 'drizzle-orm'
import { db } from '../src/db'
import { leaderboardRowToType } from '../src/db/converter/scoresaber-leaderboard'
import { scoreSaberLeaderboardsTable } from '../src/db/schema'
import { MapParityService } from '../src/service/leaderboard/map-parity.service'

async function backfillMapParity() {
  console.log('Starting map parity backfill...')

  // Fetch all leaderboards that have no crouchWalls or dodgeWalls data
  const leaderboards = await db
    .select()
    .from(scoreSaberLeaderboardsTable)
    .where(isNull(scoreSaberLeaderboardsTable.crouchWalls))

  console.log(`Found ${leaderboards.length} leaderboards needing backfill.`)

  // Convert to ScoreSaberLeaderboard type
  const parsedLeaderboards = leaderboards.map(r => leaderboardRowToType(r))

  // Process in batches
  const batches = chunkArray(parsedLeaderboards, 100)
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1}/${batches.length}...`)
    await MapParityService.populateDuckwallsForLeaderboards(batches[i])
  }

  console.log('Finished map parity backfill!')
  process.exit(0)
}

backfillMapParity().catch(console.error)
