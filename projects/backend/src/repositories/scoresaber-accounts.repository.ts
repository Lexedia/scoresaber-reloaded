import {
  and, asc, count, desc, eq, gte, ilike, isNotNull, sql, type SQL,
} from 'drizzle-orm'
import { db } from '../db'
import { scoreSaberAccountsTable, type ScoreSaberAccountRow } from '../db/schema'
import { TableCountsRepository } from './table-counts.repository'

export type ScoreSaberAccountInsert = typeof scoreSaberAccountsTable.$inferInsert

export class ScoreSaberAccountsRepository {
  public static async findRowById(id: string): Promise<ScoreSaberAccountRow | undefined> {
    const [ row ] = await db.select().from(scoreSaberAccountsTable).where(eq(scoreSaberAccountsTable.id, id))
    return row
  }

  public static async insert(row: ScoreSaberAccountInsert): Promise<void> {
    await db.insert(scoreSaberAccountsTable).values(row).onConflictDoNothing({
      target: scoreSaberAccountsTable.id,
    })
  }

  public static async existsById(id: string): Promise<boolean> {
    const rows = await db
      .select({ exists: sql`1` })
      .from(scoreSaberAccountsTable)
      .where(eq(scoreSaberAccountsTable.id, id))
    return rows.length > 0
  }

  public static async updateAccount(
    id: string,
    patch: Partial<Omit<ScoreSaberAccountRow, 'id'>>,
  ): Promise<void> {
    await db.update(scoreSaberAccountsTable).set(patch).where(eq(scoreSaberAccountsTable.id, id))
  }

  public static async searchIdsByNameIlike(pattern: string, limit: number): Promise<{ id: string }[]> {
    return db
      .select({ id: scoreSaberAccountsTable.id })
      .from(scoreSaberAccountsTable)
      .where(ilike(scoreSaberAccountsTable.name, pattern))
      .orderBy(asc(scoreSaberAccountsTable.name))
      .limit(limit)
  }

  public static async searchPlayersRankingPaginated(
    page: number,
    itemsPerPage: number,
    options?: {
      country?: string;
      search?: string;
      includeInactive?: boolean;
      hmd?: string;
    },
  ): Promise<{
    players: ScoreSaberAccountRow[],
    total: number
  }> {
    const conditions: SQL[] = []

    if (options?.country) {
      conditions.push(eq(sql`lower(${scoreSaberAccountsTable.country})`, options.country.toLowerCase()))
    }

    if (options?.search && options.search.length >= 3) {
      conditions.push(ilike(scoreSaberAccountsTable.name, `%${options.search.replace(/[%_\\]/g, '\\$&')}%`))
    }

    if (!options?.includeInactive) {
      conditions.push(eq(scoreSaberAccountsTable.inactive, false))
    }

    if (options?.hmd) {
      conditions.push(eq(sql`lower(${scoreSaberAccountsTable.hmd})`, options.hmd.toLowerCase()))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [ countRow ] = await db
      .select({ count: count() })
      .from(scoreSaberAccountsTable)
      .where(whereClause)

    const total = countRow?.count ?? 0

    const players = await db
      .select()
      .from(scoreSaberAccountsTable)
      .where(whereClause)
      .orderBy(desc(scoreSaberAccountsTable.pp))
      .limit(itemsPerPage)
      .offset((page - 1) * itemsPerPage)

    return {
      players,
      total,
    }
  }

  public static async selectHmdCountsActiveAccounts(): Promise<{
    hmd: string | null;
    c: number
  }[]> {
    return db
      .select({
        hmd: scoreSaberAccountsTable.hmd,
        c: count(),
      })
      .from(scoreSaberAccountsTable)
      .where(and(isNotNull(scoreSaberAccountsTable.hmd), eq(scoreSaberAccountsTable.inactive, false)))
      .groupBy(scoreSaberAccountsTable.hmd)
  }

  public static async selectAllActive() {
    return db
      .select()
      .from(scoreSaberAccountsTable)
      .where(and(eq(scoreSaberAccountsTable.inactive, false), eq(scoreSaberAccountsTable.banned, false)))
  }

  public static async selectIdsNeedingBeatLeaderSeed(limit?: number): Promise<{ id: string }[]> {
    const q = db
      .select({ id: scoreSaberAccountsTable.id })
      .from(scoreSaberAccountsTable)
      .where(and(eq(scoreSaberAccountsTable.seededBeatLeaderScores, false)))
    return limit != null ? q.limit(limit) : q
  }

  public static async selectIdsNeedingScoreSeed(limit?: number): Promise<{ id: string }[]> {
    const q = db
      .select({ id: scoreSaberAccountsTable.id })
      .from(scoreSaberAccountsTable)
      .where(and(eq(scoreSaberAccountsTable.seededScores, false)))
    return limit != null ? q.limit(limit) : q
  }

  public static async markInactiveWhereIdNotIn(activeIds: string[]): Promise<{ rowCount: number | null }> {
    // `notInArray` is NOT IN ($1..$N); tens of thousands of ids exceed driver/protocol limits.
    const inactiveUpdate = await db
      .update(scoreSaberAccountsTable)
      .set({ inactive: true })
      .where(sql`NOT (${scoreSaberAccountsTable.id} = ANY(${sql.param(activeIds)}))`)
    return { rowCount: inactiveUpdate.rowCount ?? null }
  }

  public static async countInactive(): Promise<number> {
    const counts = await TableCountsRepository.getCounts()
    return counts.scoresaberInactiveAccounts
  }

  public static async countTotal(): Promise<number> {
    const counts = await TableCountsRepository.getCounts()
    return counts.scoresaberAccounts
  }

  public static async countJoinedSince(date: Date): Promise<number> {
    const [ row ] = await db
      .select({ c: count() })
      .from(scoreSaberAccountsTable)
      .where(gte(scoreSaberAccountsTable.joinedDate, date))
    return row?.c ?? 0
  }

  public static async selectAllIds(): Promise<{ id: string }[]> {
    return db.select({ id: scoreSaberAccountsTable.id }).from(scoreSaberAccountsTable)
  }
}
