import { eq } from 'drizzle-orm'
import { db } from './src/db'
import { scoreSaberLeaderboardStarChangeTable } from './src/db/schema'

async function undo() {
  const deleted = await db.delete(scoreSaberLeaderboardStarChangeTable)
    .where(eq(scoreSaberLeaderboardStarChangeTable.leaderboardId, 378374))
    .returning()

  console.log('Deleted records:', deleted)
  process.exit(0)
}

undo().catch(console.error)
