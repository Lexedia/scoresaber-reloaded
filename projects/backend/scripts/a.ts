import {
  and, eq, gte, lte,
} from 'drizzle-orm'
import { db } from '../src/db'
import { playerHistoryTable } from '../src/db/schema'

const historyRows = await db
  .select({
    date: playerHistoryTable.date,
    rank: playerHistoryTable.rank,
    pp: playerHistoryTable.pp,
  })
  .from(playerHistoryTable)
  .where(
    and(
      eq(playerHistoryTable.playerId, '76561198854909134'),
      gte(playerHistoryTable.date, new Date('2026-01-01T00:00:00.000Z')),
      lte(playerHistoryTable.date, new Date('2026-12-31T23:59:59.999Z')),
    ),
  )
  .orderBy(playerHistoryTable.date)

console.log({ historyRows })
