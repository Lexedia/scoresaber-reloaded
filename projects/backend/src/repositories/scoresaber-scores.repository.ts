import { HMD } from '@ssr/common/hmds'
import type { ScoreSaberScoreSortField } from '@ssr/common/schemas/score/query/sort/scoresaber-scores-sort'
import type { SortDirection } from '@ssr/common/schemas/score/query/sort/sort-direction'
import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'
import type { AnyColumn, SQL } from 'drizzle-orm'
import {
  and, asc, count, desc, eq, getTableColumns, gt, gte, inArray, lte, sql,
} from 'drizzle-orm'
import { db } from '../db'
import { scoreSaberScoreRowToType } from '../db/converter/scoresaber-score'
import {
  scoreSaberAccountsTable,
  scoreSaberLeaderboardsTable,
  scoreSaberScoresTable,
  type ScoreSaberScoreRow,
} from '../db/schema'
import { TableCountsRepository } from './table-counts.repository'

export type ScoreSaberScoreUpsertRow = typeof scoreSaberScoresTable.$inferInsert

export type ScoreSaberPlayerScoreStatistics = {
  totalScore: number;
  totalRankedScore: number;
  totalRankedScores: number;
  totalUnrankedScores: number;
  totalScores: number;
  averageRankedAccuracy: number;
  averageUnrankedAccuracy: number;
  averageAccuracy: number;
  medianRankedAccuracy: number;
  medianUnrankedAccuracy: number;
  medianAccuracy: number;
  aPlays: number;
  sPlays: number;
  spPlays: number;
  ssPlays: number;
  sspPlays: number;
  godPlays: number;
}

export const emptyScoreStatistics: () => ScoreSaberPlayerScoreStatistics = () => ({
  totalScore: 0,
  totalRankedScore: 0,
  totalRankedScores: 0,
  totalUnrankedScores: 0,
  totalScores: 0,
  averageRankedAccuracy: 0,
  averageUnrankedAccuracy: 0,
  averageAccuracy: 0,
  medianRankedAccuracy: 0,
  medianUnrankedAccuracy: 0,
  medianAccuracy: 0,
  aPlays: 0,
  sPlays: 0,
  spPlays: 0,
  ssPlays: 0,
  sspPlays: 0,
  godPlays: 0,
})

export const scoresaberScoresBulkUpsertSet = {
  playerId: sql`excluded."playerId"`,
  leaderboardId: sql`excluded."leaderboardId"`,
  difficulty: sql`excluded."difficulty"`,
  characteristic: sql`excluded."characteristic"`,
  score: sql`excluded."score"`,
  accuracy: sql`excluded."accuracy"`,
  pp: sql`excluded."pp"`,
  rank: sql`excluded."rank"`,
  weight: sql`excluded."weight"`,
  missedNotes: sql`excluded."missedNotes"`,
  badCuts: sql`excluded."badCuts"`,
  maxCombo: sql`excluded."maxCombo"`,
  fullCombo: sql`excluded."fullCombo"`,
  modifiers: sql`excluded."modifiers"`,
  hmd: sql`excluded."hmd"`,
  rightController: sql`excluded."rightController"`,
  leftController: sql`excluded."leftController"`,
  timestamp: sql`excluded."timestamp"`,
  /** Preserved until the periodic medal recompute job runs. */
  medals: sql`"scoresaber-scores".medals`,
} as const

const scoresaberScoresUpsertOnConflictSet = scoresaberScoresBulkUpsertSet

export class ScoreSaberScoresRepository {
  public static async deleteByScoreId(scoreId: number): Promise<void> {
    await db.delete(scoreSaberScoresTable).where(eq(scoreSaberScoresTable.scoreId, scoreId))
  }

  public static async findRowByScoreId(scoreId: number): Promise<ScoreSaberScoreRow | undefined> {
    const [ row ] = await db
      .select()
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.scoreId, scoreId))
    return row
  }

  public static async rowExistsByScoreId(scoreId: number): Promise<boolean> {
    const rows = await db
      .select({ scoreId: scoreSaberScoresTable.scoreId })
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.scoreId, scoreId))
    return rows.length > 0
  }

  public static async findExistingScoreIds(scoreIds: number[]): Promise<Set<number>> {
    if (scoreIds.length === 0) {
      return new Set()
    }

    const rows = await db
      .select({ scoreId: scoreSaberScoresTable.scoreId })
      .from(scoreSaberScoresTable)
      .where(inArray(scoreSaberScoresTable.scoreId, scoreIds))
    return new Set(rows.map(row => row.scoreId))
  }

  public static async findExistingScoreRanks(scoreIds: number[]): Promise<Map<number, number>> {
    if (scoreIds.length === 0) {
      return new Map()
    }

    const rows = await db
      .select({
        scoreId: scoreSaberScoresTable.scoreId,
        rank: scoreSaberScoresTable.rank,
      })
      .from(scoreSaberScoresTable)
      .where(inArray(scoreSaberScoresTable.scoreId, scoreIds))
    return new Map(rows.map(row => [
      row.scoreId,
      row.rank,
    ]))
  }

  public static async getPlayerScoreStatistics(playerId: string): Promise<ScoreSaberPlayerScoreStatistics> {
    const [ scoreStats ] = await db
      .select({
        totalScore: sql<number>`(coalesce(sum(${scoreSaberScoresTable.score}), 0))::double precision`,
        totalRankedScore:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 then ${scoreSaberScoresTable.score} else 0 end), 0))::double precision`,
        totalRankedScores: sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 then 1 else 0 end), 0))::double precision`,
        totalUnrankedScores: sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} = 0 then 1 else 0 end), 0))::double precision`,
        totalScores: sql<number>`(coalesce(count(*), 0))::double precision`,
        averageRankedAccuracy: sql<number>`coalesce(avg(case when ${scoreSaberScoresTable.pp} > 0 then ${scoreSaberScoresTable.accuracy} end), 0)`,
        averageUnrankedAccuracy: sql<number>`coalesce(avg(case when ${scoreSaberScoresTable.pp} = 0 then ${scoreSaberScoresTable.accuracy} end), 0)`,
        averageAccuracy: sql<number>`coalesce(avg(${scoreSaberScoresTable.accuracy}), 0)`,
        medianRankedAccuracy:
          // eslint-disable-next-line @stylistic/max-len
          sql<number>`coalesce(percentile_cont(0.5) within group (order by ${scoreSaberScoresTable.accuracy}) filter (where ${scoreSaberScoresTable.pp} > 0), 0)`,
        medianUnrankedAccuracy:
          // eslint-disable-next-line @stylistic/max-len
          sql<number>`coalesce(percentile_cont(0.5) within group (order by ${scoreSaberScoresTable.accuracy}) filter (where ${scoreSaberScoresTable.pp} = 0), 0)`,
        medianAccuracy: sql<number>`coalesce(percentile_cont(0.5) within group (order by ${scoreSaberScoresTable.accuracy}), 0)`,
        aPlays:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 70 and 
            ${scoreSaberScoresTable.accuracy} < 80 then 1 else 0 end), 0))::double precision`,
        sPlays:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 80 and 
            ${scoreSaberScoresTable.accuracy} < 85 then 1 else 0 end), 0))::double precision`,
        spPlays:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 85 and 
            ${scoreSaberScoresTable.accuracy} < 90 then 1 else 0 end), 0))::double precision`,
        ssPlays:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 90 and 
            ${scoreSaberScoresTable.accuracy} < 95 then 1 else 0 end), 0))::double precision`,
        sspPlays:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 95 and 
            ${scoreSaberScoresTable.accuracy} < 98 then 1 else 0 end), 0))::double precision`,
        godPlays:
          sql<number>`(coalesce(sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 98 then
             1 else 0 end), 0))::double precision`,
      })
      .from(scoreSaberScoresTable)
      .where(and(eq(scoreSaberScoresTable.playerId, playerId), gte(scoreSaberScoresTable.accuracy, 0)))

    if (!scoreStats) {
      return emptyScoreStatistics()
    }

    return scoreStats
  }

  public static async findExistingScoreStats(scoreIds: number[]): Promise<Map<number, {
    rank: number;
    pp: number;
    weight: number;
    accuracy: number;
  }>> {
    if (scoreIds.length === 0) {
      return new Map()
    }

    const rows = await db
      .select({
        scoreId: scoreSaberScoresTable.scoreId,
        rank: scoreSaberScoresTable.rank,
        pp: scoreSaberScoresTable.pp,
        weight: scoreSaberScoresTable.weight,
        accuracy: scoreSaberScoresTable.accuracy,
      })
      .from(scoreSaberScoresTable)
      .where(inArray(scoreSaberScoresTable.scoreId, scoreIds))
    return new Map(rows.map(row => [
      row.scoreId,
      {
        rank: row.rank,
        pp: row.pp,
        weight: row.weight,
        accuracy: row.accuracy,
      },
    ]))
  }

  /**
   * Batch-updates the rank column for a set of scores where the stored rank
   * differs from the live rank returned by ScoreSaber.
   *
   * @param updates array of { scoreId, rank } pairs from the live API
   */
  public static async batchPatchRanks(updates: {
    scoreId: number;
    rank: number
  }[]): Promise<void> {
    if (updates.length === 0) {
      return
    }

    const scoreIds = updates.map(u => u.scoreId)
    const storedRanks = await ScoreSaberScoresRepository.findExistingScoreRanks(scoreIds)

    const drifted = updates.filter(u => {
      const stored = storedRanks.get(u.scoreId)
      return stored !== undefined && stored !== u.rank && u.rank > 0
    })

    if (drifted.length === 0) {
      return
    }

    // Build a single UPDATE … SET rank = CASE … END WHERE scoreId IN (…)
    const caseExpr = sql.join(
      drifted.map(u => sql`WHEN ${scoreSaberScoresTable.scoreId} = ${u.scoreId} THEN ${u.rank}::integer`),
      sql` `,
    )

    await db
      .update(scoreSaberScoresTable)
      .set({ rank: sql`CASE ${caseExpr} END` })
      .where(inArray(scoreSaberScoresTable.scoreId, drifted.map(u => u.scoreId)))
  }

  public static async existsByScoreIdAndScore(scoreId: number, scoreValue: number): Promise<boolean> {
    const rows = await db
      .select({ exists: sql`1` })
      .from(scoreSaberScoresTable)
      .where(and(eq(scoreSaberScoresTable.scoreId, scoreId), eq(scoreSaberScoresTable.score, scoreValue)))
    return rows.length > 0
  }

  public static async findByPlayerAndLeaderboard(
    playerId: string,
    leaderboardId: number,
  ): Promise<ScoreSaberScoreRow | undefined> {
    const rows = await db
      .select()
      .from(scoreSaberScoresTable)
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          eq(scoreSaberScoresTable.leaderboardId, leaderboardId),
        ),
      )
      .limit(1)
    return rows[0]
  }

  public static async upsertScore(row: ScoreSaberScoreUpsertRow): Promise<void> {
    await db.insert(scoreSaberScoresTable).values(row).onConflictDoUpdate({
      target: scoreSaberScoresTable.scoreId,
      set: scoresaberScoresUpsertOnConflictSet,
    })
  }

  public static async bulkUpsertScores(rows: ScoreSaberScoreUpsertRow[]): Promise<void> {
    if (rows.length === 0) {
      return
    }
    await db.insert(scoreSaberScoresTable).values(rows).onConflictDoUpdate({
      target: scoreSaberScoresTable.scoreId,
      set: scoresaberScoresBulkUpsertSet,
    })
  }

  public static async countByPlayerId(playerId: string): Promise<number> {
    const [ row ] = await db
      .select({ count: count() })
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.playerId, playerId))
    return row?.count ?? 0
  }

  public static async countByLeaderboardId(leaderboardId: number): Promise<number> {
    const [ row ] = await db
      .select({ count: count() })
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.leaderboardId, leaderboardId))
    return row?.count ?? 0
  }

  public static async countByConditions(conditions: SQL[]): Promise<number> {
    const [ row ] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(scoreSaberScoresTable)
      .where(and(...conditions))
    return Number(row?.count ?? 0)
  }

  public static async findRowsByConditions(
    conditions: SQL[],
    orderBy: SQL | AnyColumn,
    limit: number,
    offset: number,
  ): Promise<ScoreSaberScoreRow[]> {
    return db
      .select()
      .from(scoreSaberScoresTable)
      .where(and(...conditions))
      .orderBy(orderBy as SQL)
      .limit(limit)
      .offset(offset)
  }

  public static async getLeaderboardScoresPaginated(
    leaderboardId: number,
    page: number,
    itemsPerPage: number,
    country?: string,
    hmd?: string,
    sort?: ScoreSaberScoreSortField,
    direction?: SortDirection,
  ): Promise<{
    scores: ScoreSaberScore[];
    total: number
  }> {
    const conditions: SQL[] = [ eq(scoreSaberScoresTable.leaderboardId, leaderboardId) ]

    if (country) {
      conditions.push(eq(sql`lower(${scoreSaberAccountsTable.country})`, country.toLowerCase()))
    }

    if (hmd) {
      conditions.push(eq(sql`lower(${scoreSaberScoresTable.hmd})`, hmd.toLowerCase()))
    }

    const [ countRow ] = await db
      .select({ count: count() })
      .from(scoreSaberScoresTable)
      .leftJoin(scoreSaberAccountsTable, eq(scoreSaberScoresTable.playerId, scoreSaberAccountsTable.id))
      .where(and(...conditions))

    const total = countRow?.count ?? 0

    const orderByClauses = (() => {
      if (sort) {
        const column = ScoreSaberScoresRepository.getSortColumn(sort)
        const orderFn = direction === 'asc' ? asc : desc
        return [ orderFn(column), desc(scoreSaberScoresTable.accuracy) ]
      }
      return [ desc(scoreSaberScoresTable.score), desc(scoreSaberScoresTable.accuracy) ]
    })()

    const rows = await db
      .select({
        score: scoreSaberScoresTable,
        account: scoreSaberAccountsTable,
      })
      .from(scoreSaberScoresTable)
      .leftJoin(scoreSaberAccountsTable, eq(scoreSaberScoresTable.playerId, scoreSaberAccountsTable.id))
      .where(and(...conditions))
      .orderBy(...orderByClauses)
      .limit(itemsPerPage)
      .offset((page - 1) * itemsPerPage)

    const scores = rows.map(({ score, account }) => {
      const parsed = scoreSaberScoreRowToType(score)
      if (account) {
        parsed.playerInfo = {
          id: account.id,
          name: account.name,
          avatar: account.avatar,
          country: account.country ?? undefined,
        }
      }
      return parsed
    })

    return {
      scores,
      total,
    }
  }

  public static async getTopScores(limit: number, offset: number): Promise<ScoreSaberScoreRow[]> {
    return db
      .select(getTableColumns(scoreSaberScoresTable))
      .from(scoreSaberScoresTable)
      .innerJoin(scoreSaberAccountsTable, eq(scoreSaberScoresTable.playerId, scoreSaberAccountsTable.id))
      .where(and(gt(scoreSaberScoresTable.pp, 0), eq(scoreSaberAccountsTable.banned, false)))
      .orderBy(desc(scoreSaberScoresTable.pp))
      .limit(limit)
      .offset(offset)
  }

  public static async selectTopPp(limit: number = 50): Promise<{ pp: number }[]> {
    return db
      .select({ pp: scoreSaberScoresTable.pp })
      .from(scoreSaberScoresTable)
      .where(gt(scoreSaberScoresTable.pp, 0))
      .orderBy(desc(scoreSaberScoresTable.pp))
      .limit(limit)
  }

  public static async getScoreIdsByPlayerId(playerId: string): Promise<{
    scoreId: number;
    score: number
  }[]> {
    return db
      .select({
        scoreId: scoreSaberScoresTable.scoreId,
        score: scoreSaberScoresTable.score,
      })
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.playerId, playerId))
  }

  public static async getPpAndScoreIdByPlayer(playerId: string): Promise<{
    pp: number;
    scoreId: number
  }[]> {
    return db
      .select({
        pp: scoreSaberScoresTable.pp,
        scoreId: scoreSaberScoresTable.scoreId,
      })
      .from(scoreSaberScoresTable)
      .where(and(eq(scoreSaberScoresTable.playerId, playerId), gt(scoreSaberScoresTable.pp, 0)))
      .orderBy(desc(scoreSaberScoresTable.pp))
  }

  public static async getPpByPlayer(playerId: string): Promise<{ pp: number }[]> {
    return db
      .select({ pp: scoreSaberScoresTable.pp })
      .from(scoreSaberScoresTable)
      .where(and(eq(scoreSaberScoresTable.playerId, playerId), gt(scoreSaberScoresTable.pp, 0)))
      .orderBy(desc(scoreSaberScoresTable.pp))
  }

  public static async getRankedRowsByPlayerId(playerId: string): Promise<ScoreSaberScoreRow[]> {
    return db
      .select()
      .from(scoreSaberScoresTable)
      .where(and(eq(scoreSaberScoresTable.playerId, playerId), gt(scoreSaberScoresTable.pp, 0)))
  }

  public static async getAverageAccuracies(playerId: string): Promise<{
    averageAccuracy: number;
    unrankedAccuracy: number;
  }> {
    const [ result ] = await db
      .select({
        averageAccuracy: sql<number>`coalesce(avg(${scoreSaberScoresTable.accuracy}), 0)`,
        unrankedAccuracy: sql<number>`coalesce(avg(case when ${scoreSaberScoresTable.pp} = 0 then ${scoreSaberScoresTable.accuracy} end), 0)`,
      })
      .from(scoreSaberScoresTable)
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.accuracy, 0),
          lte(scoreSaberScoresTable.accuracy, 100),
        ),
      )

    return {
      averageAccuracy: Number(result?.averageAccuracy ?? 0),
      unrankedAccuracy: Number(result?.unrankedAccuracy ?? 0),
    }
  }

  public static async countFriendScoresOnLeaderboard(
    friendIds: string[],
    leaderboardId: number,
  ): Promise<number> {
    const conditions = and(
      inArray(scoreSaberScoresTable.playerId, friendIds),
      eq(scoreSaberScoresTable.leaderboardId, leaderboardId),
    )
    const [ { total } ] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(scoreSaberScoresTable)
      .where(conditions)
    return total
  }

  public static async findFriendScoresOnLeaderboardPage(
    friendIds: string[],
    leaderboardId: number,
    limit: number,
    offset: number,
  ): Promise<ScoreSaberScoreRow[]> {
    const conditions = and(
      inArray(scoreSaberScoresTable.playerId, friendIds),
      eq(scoreSaberScoresTable.leaderboardId, leaderboardId),
    )
    return db
      .select()
      .from(scoreSaberScoresTable)
      .where(conditions)
      .orderBy(desc(scoreSaberScoresTable.score))
      .limit(limit)
      .offset(offset)
  }

  public static async getHmdByPlayerId(playerId: string, limit?: number): Promise<{ hmd: HMD }[]> {
    const q = db
      .select({ hmd: scoreSaberScoresTable.hmd })
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.playerId, playerId))
    return limit != null ? q.limit(limit) : q
  }

  public static async getChartRowsByPlayer(playerId: string): Promise<
    {
      accuracy: number;
      pp: number;
      timestamp: Date;
      leaderboardId: number;
      difficulty: ScoreSaberScoreRow['difficulty'];
      characteristic: string;
      songName: string | null;
      stars: number | null;
    }[]
  > {
    return db
      .select({
        accuracy: scoreSaberScoresTable.accuracy,
        pp: scoreSaberScoresTable.pp,
        timestamp: scoreSaberScoresTable.timestamp,
        leaderboardId: scoreSaberLeaderboardsTable.id,
        difficulty: scoreSaberLeaderboardsTable.difficulty,
        characteristic: scoreSaberLeaderboardsTable.characteristic,
        songName: scoreSaberLeaderboardsTable.songName,
        stars: scoreSaberLeaderboardsTable.stars,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .where(and(eq(scoreSaberScoresTable.playerId, playerId), gt(scoreSaberScoresTable.pp, 0)))
      .orderBy(desc(scoreSaberScoresTable.timestamp))
  }

  public static async selectScoresJoinedLeaderboardsWhere(
    conditions: SQL[],
  ): Promise<{
    scoreRow: ScoreSaberScoreRow;
    lbRow: typeof scoreSaberLeaderboardsTable.$inferSelect
  }[]> {
    return db
      .select({
        scoreRow: scoreSaberScoresTable,
        lbRow: scoreSaberLeaderboardsTable,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .where(and(...conditions))
  }

  public static async selectDistinctLeaderboardIdsByPlayerId(playerId: string): Promise<number[]> {
    const rows = await db
      .select({ leaderboardId: scoreSaberScoresTable.leaderboardId })
      .from(scoreSaberScoresTable)
      .where(eq(scoreSaberScoresTable.playerId, playerId))
      .groupBy(scoreSaberScoresTable.leaderboardId)
    return rows.map(r => r.leaderboardId)
  }

  public static async countTotal(): Promise<number> {
    const counts = await TableCountsRepository.getCounts()
    return counts.scoresaberScores
  }

  public static async getMapRecommendations(playerId: string, topN: number = 20, limit: number = 10) {
    const result = await db.execute(sql`
      WITH TargetPlayerTopScores AS (
        SELECT "leaderboardId"
        FROM "scoresaber-scores"
        WHERE "playerId" = ${playerId} AND pp > 0
        ORDER BY pp DESC
        LIMIT ${topN}
      ), SimilarUsers AS (
        SELECT "playerId"
        FROM "scoresaber-scores"
        WHERE "leaderboardId" IN (SELECT "leaderboardId" FROM TargetPlayerTopScores)
          AND "playerId" != ${playerId}
        GROUP BY "playerId"
        ORDER BY COUNT(*) DESC
        LIMIT 100
      ), CandidateScores AS (
        SELECT "leaderboardId", pp
        FROM "scoresaber-scores"
        WHERE "playerId" IN (SELECT "playerId" FROM SimilarUsers)
          AND pp > 0
          AND "leaderboardId" NOT IN (
            SELECT "leaderboardId" FROM "scoresaber-scores" WHERE "playerId" = ${playerId}
          )
      ), AggregatedCandidates AS (
        SELECT
          "leaderboardId",
          COUNT(*) as frequency,
          AVG(pp) as "averagePp"
        FROM CandidateScores
        GROUP BY "leaderboardId"
        ORDER BY frequency DESC, "averagePp" DESC
        LIMIT ${limit}
      )
      SELECT
        a."leaderboardId",
        CAST(a.frequency AS INTEGER) as frequency,
        CAST(a."averagePp" AS FLOAT) as "averagePp",
        l."songName",
        l."songSubName",
        l."songAuthorName",
        l."levelAuthorName",
        l."difficulty",
        l."stars",
        l."songHash"
      FROM AggregatedCandidates a
      JOIN "scoresaber-leaderboards" l ON l.id = a."leaderboardId"
      ORDER BY a.frequency DESC, a."averagePp" DESC
    `)

    return result.rows as unknown as {
      leaderboardId: number
      frequency: number
      averagePp: number
      stars: number
      songName: string
      songSubName: string
      songAuthorName: string
      levelAuthorName: string
      difficulty: string
      songHash: string
    }[]
  }

  /**
   * Resolves a sort field to its corresponding database column.
   */
  private static getSortColumn(sort: ScoreSaberScoreSortField): AnyColumn | SQL {
    switch (sort) {
      case 'pp':
        return scoreSaberScoresTable.pp
      case 'acc':
        return scoreSaberScoresTable.accuracy
      case 'score':
        return scoreSaberScoresTable.score
      case 'misses':
        return sql`${scoreSaberScoresTable.missedNotes} + ${scoreSaberScoresTable.badCuts}`
      case 'maxcombo':
        return scoreSaberScoresTable.maxCombo
      case 'date':
        return scoreSaberScoresTable.timestamp
      default: {
        const _exhaustive: never = sort
        return _exhaustive
      }
    }
  }
}
