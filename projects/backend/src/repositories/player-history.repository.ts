import { ScoreSaberPlayerHistory } from '@ssr/common/schemas/scoresaber/player/history'
import {
  and, count, desc, eq, gte, lte, sql,
} from 'drizzle-orm'
import { db } from '../db'
import { type PlayerHistoryRow, playerHistoryTable } from '../db/schema'

export type DailyScoreCounterKey =
  | 'rankedScores'
  | 'unrankedScores'
  | 'rankedScoresImproved'
  | 'unrankedScoresImproved'

export class PlayerHistoryRepository {
  public static async findByPlayerAndDate(
    playerId: string,
    date: Date,
  ): Promise<PlayerHistoryRow | undefined> {
    const [ row ] = await db
      .select()
      .from(playerHistoryTable)
      .where(and(eq(playerHistoryTable.playerId, playerId), eq(playerHistoryTable.date, date)))
    return row
  }

  public static async upsertByPlayerAndDate(
    playerId: string,
    date: Date,
    data: ScoreSaberPlayerHistory,
  ): Promise<void> {
    await db
      .insert(playerHistoryTable)
      .values({
        playerId,
        date,
        ...data,
      })
      .onConflictDoUpdate({
        target: [
          playerHistoryTable.playerId,
          playerHistoryTable.date,
        ],
        set: {
          rank: sql`excluded."rank"`,
          countryRank: sql`excluded."countryRank"`,
          medals: sql`excluded."medals"`,
          pp: sql`excluded."pp"`,
          plusOnePp: sql`excluded."plusOnePp"`,
          totalScore: sql`excluded."totalScore"`,
          totalRankedScore: sql`excluded."totalRankedScore"`,
          rankedScores: sql`excluded."rankedScores"`,
          unrankedScores: sql`excluded."unrankedScores"`,
          rankedScoresImproved: sql`excluded."rankedScoresImproved"`,
          unrankedScoresImproved: sql`excluded."unrankedScoresImproved"`,
          totalRankedScores: sql`excluded."totalRankedScores"`,
          totalUnrankedScores: sql`excluded."totalUnrankedScores"`,
          totalScores: sql`excluded."totalScores"`,
          averageRankedAccuracy: sql`excluded."averageRankedAccuracy"`,
          averageUnrankedAccuracy: sql`excluded."averageUnrankedAccuracy"`,
          averageAccuracy: sql`excluded."averageAccuracy"`,
          medianRankedAccuracy: sql`excluded."medianRankedAccuracy"`,
          medianUnrankedAccuracy: sql`excluded."medianUnrankedAccuracy"`,
          medianAccuracy: sql`excluded."medianAccuracy"`,
          aPlays: sql`excluded."aPlays"`,
          sPlays: sql`excluded."sPlays"`,
          spPlays: sql`excluded."spPlays"`,
          ssPlays: sql`excluded."ssPlays"`,
          sspPlays: sql`excluded."sspPlays"`,
          godPlays: sql`excluded."godPlays"`,
        },
      })
  }

  public static async getByPlayerOrderedByDateDesc(
    playerId: string,
    options: {
      count: number;
      alignedStart: Date;
      today: Date
    },
  ): Promise<PlayerHistoryRow[]> {
    const { count: dayCount, alignedStart, today } = options
    const base = db
      .select()
      .from(playerHistoryTable)
      .where(
        and(
          eq(playerHistoryTable.playerId, playerId),
          gte(playerHistoryTable.date, alignedStart),
          lte(playerHistoryTable.date, today),
        ),
      )
      .orderBy(desc(playerHistoryTable.date))
    return await (dayCount > 0 ? base.limit(dayCount) : base)
  }

  public static async upsertRank(playerId: string, date: Date, rank: number): Promise<void> {
    await db
      .insert(playerHistoryTable)
      .values({
        playerId,
        date,
        rank,
      })
      .onConflictDoUpdate({
        target: [
          playerHistoryTable.playerId,
          playerHistoryTable.date,
        ],
        set: { rank },
      })
  }

  public static async bulkUpsertRanks(rows: {
    playerId: string;
    date: Date;
    rank: number
  }[]): Promise<void> {
    if (rows.length === 0) {
      return
    }

    await db
      .insert(playerHistoryTable)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          playerHistoryTable.playerId,
          playerHistoryTable.date,
        ],
        set: { rank: sql`excluded.rank` },
      })
  }

  public static async incrementDailyCounter(
    playerId: string,
    date: Date,
    counterKey: DailyScoreCounterKey,
  ): Promise<void> {
    const incrementSet = (() => {
      switch (counterKey) {
        case 'rankedScores':
          return { rankedScores: sql`COALESCE(${playerHistoryTable.rankedScores}, 0) + 1` }
        case 'unrankedScores':
          return { unrankedScores: sql`COALESCE(${playerHistoryTable.unrankedScores}, 0) + 1` }
        case 'rankedScoresImproved':
          return { rankedScoresImproved: sql`COALESCE(${playerHistoryTable.rankedScoresImproved}, 0) + 1` }
        case 'unrankedScoresImproved':
          return {
            unrankedScoresImproved: sql`COALESCE(${playerHistoryTable.unrankedScoresImproved}, 0) + 1`,
          }
      }
    })()

    await db
      .insert(playerHistoryTable)
      .values({
        playerId,
        date,
        [counterKey]: 1,
      })
      .onConflictDoUpdate({
        target: [
          playerHistoryTable.playerId,
          playerHistoryTable.date,
        ],
        set: incrementSet,
      })
  }

  public static async countRowsForPlayer(playerId: string): Promise<number> {
    const [ row ] = await db
      .select({ c: count() })
      .from(playerHistoryTable)
      .where(eq(playerHistoryTable.playerId, playerId))
    return row?.c ?? 0
  }

  public static async bulkUpsertHistory(rows: (Partial<ScoreSaberPlayerHistory> & {
    playerId: string,
    date: Date
  })[]): Promise<void> {
    if (rows.length === 0) {
      return
    }

    await db
      .insert(playerHistoryTable)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          playerHistoryTable.playerId,
          playerHistoryTable.date,
        ],
        set: {
          rank: sql`COALESCE(excluded."rank", ${playerHistoryTable.rank})`,
          countryRank: sql`COALESCE(excluded."countryRank", ${playerHistoryTable.countryRank})`,
          medals: sql`COALESCE(excluded."medals", ${playerHistoryTable.medals})`,
          pp: sql`COALESCE(excluded."pp", ${playerHistoryTable.pp})`,
          plusOnePp: sql`COALESCE(excluded."plusOnePp", ${playerHistoryTable.plusOnePp})`,
          totalScore: sql`COALESCE(excluded."totalScore", ${playerHistoryTable.totalScore})`,
          totalRankedScore: sql`COALESCE(excluded."totalRankedScore", ${playerHistoryTable.totalRankedScore})`,
          rankedScores: sql`COALESCE(excluded."rankedScores", ${playerHistoryTable.rankedScores})`,
          unrankedScores: sql`COALESCE(excluded."unrankedScores", ${playerHistoryTable.unrankedScores})`,
          rankedScoresImproved: sql`COALESCE(excluded."rankedScoresImproved", ${playerHistoryTable.rankedScoresImproved})`,
          unrankedScoresImproved: sql`COALESCE(excluded."unrankedScoresImproved", ${playerHistoryTable.unrankedScoresImproved})`,
          totalRankedScores: sql`COALESCE(excluded."totalRankedScores", ${playerHistoryTable.totalRankedScores})`,
          totalUnrankedScores: sql`COALESCE(excluded."totalUnrankedScores", ${playerHistoryTable.totalUnrankedScores})`,
          totalScores: sql`COALESCE(excluded."totalScores", ${playerHistoryTable.totalScores})`,
          averageRankedAccuracy: sql`COALESCE(excluded."averageRankedAccuracy", ${playerHistoryTable.averageRankedAccuracy})`,
          averageUnrankedAccuracy: sql`COALESCE(excluded."averageUnrankedAccuracy", ${playerHistoryTable.averageUnrankedAccuracy})`,
          averageAccuracy: sql`COALESCE(excluded."averageAccuracy", ${playerHistoryTable.averageAccuracy})`,
          medianRankedAccuracy: sql`COALESCE(excluded."medianRankedAccuracy", ${playerHistoryTable.medianRankedAccuracy})`,
          medianUnrankedAccuracy: sql`COALESCE(excluded."medianUnrankedAccuracy", ${playerHistoryTable.medianUnrankedAccuracy})`,
          medianAccuracy: sql`COALESCE(excluded."medianAccuracy", ${playerHistoryTable.medianAccuracy})`,
          aPlays: sql`COALESCE(excluded."aPlays", ${playerHistoryTable.aPlays})`,
          sPlays: sql`COALESCE(excluded."sPlays", ${playerHistoryTable.sPlays})`,
          spPlays: sql`COALESCE(excluded."spPlays", ${playerHistoryTable.spPlays})`,
          ssPlays: sql`COALESCE(excluded."ssPlays", ${playerHistoryTable.ssPlays})`,
          sspPlays: sql`COALESCE(excluded."sspPlays", ${playerHistoryTable.sspPlays})`,
          godPlays: sql`COALESCE(excluded."godPlays", ${playerHistoryTable.godPlays})`,
        },
      })
  }
}
