/* eslint-disable @stylistic/max-len */
import {
  PlayerWrappedResponse,
  PlayerWrappedTopPlay,
} from '@ssr/common/schemas/response/player/player-wrapped'
import {
  and, desc, eq, gte, lte, sql,
} from 'drizzle-orm'
import { db } from '../../db'
import {
  beatSaverMapsTable,
  beatSaverMapVersionsTable,
  beatSaverUploadersTable,
  playerHistoryTable,
  scoreSaberLeaderboardsTable,
  scoreSaberScoresTable,
} from '../../db/schema'

export class PlayerWrappedService {
  /**
   * Generates a "Wrapped" summary for a player for a given year.
   * Aggregates score history and player history data for that calendar year.
   *
   * @param playerId the player's ScoreSaber ID
   * @param year the year to summarize (e.g. 2026)
   */
  public static async getWrapped(
    playerId: string,
    year: number,
  ): Promise<PlayerWrappedResponse> {
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`)
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`)

    const [ scoreStats ] = await db
      .select({
        totalPlays: sql<number>`count(*)::int`,
        totalRankedPlays: sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 then 1 else 0 end)::int`,
        totalUnrankedPlays: sql<number>`sum(case when ${scoreSaberScoresTable.pp} = 0 then 1 else 0 end)::int`,
        averageAccuracy: sql<number>`coalesce(avg(${scoreSaberScoresTable.accuracy}), 0)`,
        aPlays:
          sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 70 and ${scoreSaberScoresTable.accuracy} < 80 then 1 else 0 end)::int`,
        sPlays:
          sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 80 and ${scoreSaberScoresTable.accuracy} < 85 then 1 else 0 end)::int`,
        spPlays:
          sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 85 and ${scoreSaberScoresTable.accuracy} < 90 then 1 else 0 end)::int`,
        ssPlays:
          sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 90 and ${scoreSaberScoresTable.accuracy} < 95 then 1 else 0 end)::int`,
        sspPlays:
          sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 95 and ${scoreSaberScoresTable.accuracy} < 98 then 1 else 0 end)::int`,
        godPlays:
          sql<number>`sum(case when ${scoreSaberScoresTable.pp} > 0 and ${scoreSaberScoresTable.accuracy} >= 98 then 1 else 0 end)::int`,
      })
      .from(scoreSaberScoresTable)
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
        ),
      )

    const [ topPlayRow ] = await db
      .select({
        leaderboardId: scoreSaberScoresTable.leaderboardId,
        scoreId: scoreSaberScoresTable.scoreId,
        pp: scoreSaberScoresTable.pp,
        accuracy: scoreSaberScoresTable.accuracy,
        rank: scoreSaberScoresTable.rank,
        fullCombo: scoreSaberScoresTable.fullCombo,
        timestamp: scoreSaberScoresTable.timestamp,
        songName: scoreSaberLeaderboardsTable.songName,
        songHash: scoreSaberLeaderboardsTable.songHash,
        stars: scoreSaberLeaderboardsTable.stars,
        difficulty: scoreSaberLeaderboardsTable.difficulty,
        characteristic: scoreSaberLeaderboardsTable.characteristic,
        maxCombo: scoreSaberScoresTable.maxCombo,
        missedNotes: scoreSaberScoresTable.missedNotes,
        badCuts: scoreSaberScoresTable.badCuts,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
          sql`${scoreSaberScoresTable.pp} > 0`,
        ),
      )
      .orderBy(desc(scoreSaberScoresTable.pp))
      .limit(1)

    const topPlay: PlayerWrappedTopPlay | null = topPlayRow ?? null

    const activeDaysRows = await db
      .selectDistinct({
        day: sql<string>`date_trunc('day', ${scoreSaberScoresTable.timestamp})`,
      })
      .from(scoreSaberScoresTable)
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
        ),
      )

    const activeDays = activeDaysRows.length

    const historyRows = await db
      .select({
        date: playerHistoryTable.date,
        rank: playerHistoryTable.rank,
        pp: playerHistoryTable.pp,
      })
      .from(playerHistoryTable)
      .where(
        and(
          eq(playerHistoryTable.playerId, playerId),
          gte(playerHistoryTable.date, yearStart),
          lte(playerHistoryTable.date, yearEnd),
        ),
      )
      .orderBy(playerHistoryTable.date)

    const firstSnapshot = historyRows.at(0)
    const lastSnapshot = historyRows.at(-1)
    const ppStart = firstSnapshot?.pp ?? null
    const ppEnd = lastSnapshot?.pp ?? null

    const [ topMapperRow ] = await db
      .select({
        mapper: beatSaverUploadersTable.name,
        avatar: beatSaverUploadersTable.avatar,
        count: sql<number>`count(*)::int`,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .innerJoin(
        beatSaverMapVersionsTable,
        sql`lower(${scoreSaberLeaderboardsTable.songHash}) = ${beatSaverMapVersionsTable.hash}`,
      )
      .innerJoin(
        beatSaverMapsTable,
        eq(beatSaverMapVersionsTable.mapId, beatSaverMapsTable.id),
      )
      .innerJoin(
        beatSaverUploadersTable,
        eq(beatSaverMapsTable.uploaderId, beatSaverUploadersTable.id),
      )
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
        ),
      )
      .groupBy(beatSaverUploadersTable.name, beatSaverUploadersTable.avatar)
      .orderBy(desc(sql`count(*)`))
      .limit(1)

    const [ topHmdRow ] = await db
      .select({
        hmd: scoreSaberScoresTable.hmd,
        count: sql<number>`count(*)::int`,
      })
      .from(scoreSaberScoresTable)
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
          sql`${scoreSaberScoresTable.hmd} != 'Unknown'`,
        ),
      )
      .groupBy(scoreSaberScoresTable.hmd)
      .orderBy(desc(sql`count(*)`))
      .limit(1)

    const [ totalTimeRow ] = await db
      .select({
        totalSeconds: sql<number>`sum(${beatSaverMapsTable.duration})::int`,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .innerJoin(
        beatSaverMapVersionsTable,
        sql`lower(${scoreSaberLeaderboardsTable.songHash}) = ${beatSaverMapVersionsTable.hash}`,
      )
      .innerJoin(
        beatSaverMapsTable,
        eq(beatSaverMapVersionsTable.mapId, beatSaverMapsTable.id),
      )
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
        ),
      )

    const [ biggestComboRow ] = await db
      .select({
        leaderboardId: scoreSaberScoresTable.leaderboardId,
        scoreId: scoreSaberScoresTable.scoreId,
        pp: scoreSaberScoresTable.pp,
        accuracy: scoreSaberScoresTable.accuracy,
        rank: scoreSaberScoresTable.rank,
        fullCombo: scoreSaberScoresTable.fullCombo,
        timestamp: scoreSaberScoresTable.timestamp,
        songName: scoreSaberLeaderboardsTable.songName,
        songHash: scoreSaberLeaderboardsTable.songHash,
        stars: scoreSaberLeaderboardsTable.stars,
        difficulty: scoreSaberLeaderboardsTable.difficulty,
        characteristic: scoreSaberLeaderboardsTable.characteristic,
        maxCombo: scoreSaberScoresTable.maxCombo,
        missedNotes: scoreSaberScoresTable.missedNotes,
        badCuts: scoreSaberScoresTable.badCuts,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
          eq(scoreSaberScoresTable.fullCombo, true),
        ),
      )
      .orderBy(desc(scoreSaberScoresTable.maxCombo))
      .limit(1)

    const [ worstChokeRow ] = await db
      .select({
        leaderboardId: scoreSaberScoresTable.leaderboardId,
        scoreId: scoreSaberScoresTable.scoreId,
        pp: scoreSaberScoresTable.pp,
        accuracy: scoreSaberScoresTable.accuracy,
        rank: scoreSaberScoresTable.rank,
        fullCombo: scoreSaberScoresTable.fullCombo,
        timestamp: scoreSaberScoresTable.timestamp,
        songName: scoreSaberLeaderboardsTable.songName,
        songHash: scoreSaberLeaderboardsTable.songHash,
        stars: scoreSaberLeaderboardsTable.stars,
        difficulty: scoreSaberLeaderboardsTable.difficulty,
        characteristic: scoreSaberLeaderboardsTable.characteristic,
        maxCombo: scoreSaberScoresTable.maxCombo,
        missedNotes: scoreSaberScoresTable.missedNotes,
        badCuts: scoreSaberScoresTable.badCuts,
      })
      .from(scoreSaberScoresTable)
      .innerJoin(
        scoreSaberLeaderboardsTable,
        eq(scoreSaberScoresTable.leaderboardId, scoreSaberLeaderboardsTable.id),
      )
      .where(
        and(
          eq(scoreSaberScoresTable.playerId, playerId),
          gte(scoreSaberScoresTable.timestamp, yearStart),
          lte(scoreSaberScoresTable.timestamp, yearEnd),
          eq(scoreSaberScoresTable.fullCombo, false),
          sql`${scoreSaberScoresTable.missedNotes} + ${scoreSaberScoresTable.badCuts} = 1`,
        ),
      )
      .orderBy(desc(scoreSaberScoresTable.pp))
      .limit(1)

    const topStyleRowResult = await db.execute(sql`
      SELECT tag as style, count(*)::int as count
      FROM ${scoreSaberScoresTable}
      INNER JOIN ${scoreSaberLeaderboardsTable} ON ${scoreSaberScoresTable.leaderboardId} = ${scoreSaberLeaderboardsTable.id}
      INNER JOIN ${beatSaverMapVersionsTable} ON lower(${scoreSaberLeaderboardsTable.songHash}) = ${beatSaverMapVersionsTable.hash}
      INNER JOIN ${beatSaverMapsTable} ON ${beatSaverMapVersionsTable.mapId} = ${beatSaverMapsTable.id},
      unnest(${beatSaverMapsTable.tags}) as tag
      WHERE ${scoreSaberScoresTable.playerId} = ${playerId}
        AND ${scoreSaberScoresTable.timestamp} >= ${yearStart}
        AND ${scoreSaberScoresTable.timestamp} <= ${yearEnd}
        AND tag IN ('balanced', 'tech', 'dance-style', 'speed', 'challenge', 'accuracy', 'fitness', 'poodle')
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 1
    `)
    const topStyleRow = topStyleRowResult.rows[0] as {
      style: string;
      count: number
    } | undefined

    return {
      playerId,
      year,
      totalPlays: scoreStats?.totalPlays ?? 0,
      totalRankedPlays: scoreStats?.totalRankedPlays ?? 0,
      totalUnrankedPlays: scoreStats?.totalUnrankedPlays ?? 0,
      averageAccuracy: scoreStats?.averageAccuracy ?? 0,
      aPlays: scoreStats?.aPlays ?? 0,
      sPlays: scoreStats?.sPlays ?? 0,
      spPlays: scoreStats?.spPlays ?? 0,
      ssPlays: scoreStats?.ssPlays ?? 0,
      sspPlays: scoreStats?.sspPlays ?? 0,
      godPlays: scoreStats?.godPlays ?? 0,
      topPlay,
      rankStart: firstSnapshot?.rank ?? null,
      rankEnd: lastSnapshot?.rank ?? null,
      ppStart,
      ppEnd,
      ppGained: ppStart !== null && ppEnd !== null ? ppEnd - ppStart : 0,
      activeDays,
      topMapper: topMapperRow?.mapper ?? null,
      topMapperPlays: topMapperRow?.count ?? null,
      topMapperAvatar: topMapperRow?.avatar ?? null,
      topHmd: topHmdRow?.hmd ?? null,
      topHmdPlays: topHmdRow?.count ?? null,
      totalPlaySeconds: totalTimeRow?.totalSeconds ?? 0,
      biggestCombo: biggestComboRow ?? null,
      worstChoke: worstChokeRow ?? null,
      topStyle: topStyleRow?.style ?? null,
      topStylePlays: topStyleRow?.count ?? null,
    }
  }
}
