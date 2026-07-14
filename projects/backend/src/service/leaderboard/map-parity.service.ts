import { env } from '@ssr/common/env'
import Logger from '@ssr/common/logger'
import { MapCharacteristic } from '@ssr/common/schemas/map/map-characteristic'
import { MapDifficulty } from '@ssr/common/schemas/map/map-difficulty'
import { ScoreSaberLeaderboard } from '@ssr/common/schemas/scoresaber/leaderboard/leaderboard'
import { z } from 'zod'
import { ScoreSaberLeaderboardsRepository } from '../../repositories/scoresaber-leaderboards.repository'

// BeatLeader difficulty values
const BEATLEADER_DIFFICULTY_MAP: Record<MapDifficulty, number> = {
  Easy: 1,
  Normal: 3,
  Hard: 5,
  Expert: 7,
  ExpertPlus: 9,
}

// BeatLeader mode values for characteristics
const BEATLEADER_MODE_MAP: Record<MapCharacteristic, number> = {
  Standard: 1,
  OneSaber: 2,
  NoArrows: 3,
  '90Degree': 4,
  '360Degree': 5,
  Lightshow: 6,
  Lawless: 7,
}

const DifficultyStatisticsSchema = z.object({
  dodgeWalls: z.number(),
  crouchWalls: z.number(),
}).partial()

const BeatLeaderLeaderboardSchema = z.object({
  difficulty: z.object({
    difficultyStatistics: DifficultyStatisticsSchema.nullable().optional(),
  }),
})

async function fetchDifficultyStatistics(
  songHash: string,
  difficulty: MapDifficulty,
  characteristic: MapCharacteristic,
): Promise<{
  crouchWalls: number;
  dodgeWalls: number
} | null> {
  const diffValue = BEATLEADER_DIFFICULTY_MAP[difficulty]
  const modeValue = BEATLEADER_MODE_MAP[characteristic]

  if (diffValue == null || modeValue == null) {
    return null
  }

  const mapResponse = await fetch(
    `https://api.${env.NEXT_PUBLIC_BEATLEADER_DOMAIN}/map/hash/${songHash.toLowerCase()}`,
    { signal: AbortSignal.timeout(15_000) },
  )
  if (!mapResponse.ok)
    return null

  const mapData = (await mapResponse.json()) as { id?: string }
  const beatsaverId = mapData?.id
  if (!beatsaverId)
    return null

  const leaderboardId = `${beatsaverId}${diffValue}${modeValue}`

  const lbResponse = await fetch(
    `https://api.${env.NEXT_PUBLIC_BEATLEADER_DOMAIN}/leaderboard/${leaderboardId}?page=1&count=1`,
    { signal: AbortSignal.timeout(15_000) },
  )
  if (!lbResponse.ok)
    return null

  const lbData = await lbResponse.json()
  const parsed = BeatLeaderLeaderboardSchema.safeParse(lbData)
  if (!parsed.success)
    return null

  const stats = parsed.data.difficulty.difficultyStatistics
  if (!stats)
    return null

  return {
    crouchWalls: stats.crouchWalls ?? 0,
    dodgeWalls: stats.dodgeWalls ?? 0,
  }
}

export class MapParityService {
  private static readonly logger = Logger.withTopic('Map Parity Service')

  /**
   * Fetches crouchWalls and dodgeWalls for a batch of leaderboards using the BeatLeader API.
   * Groups leaderboards by song hash and fetches per difficulty, then stores results in DB.
   */
  public static async populateDuckwallsForLeaderboards(leaderboards: ScoreSaberLeaderboard[]): Promise<void> {
    if (leaderboards.length === 0)
      return

    this.logger.info(`Fetching map parity from BeatLeader for ${leaderboards.length} leaderboards...`)

    for (const lb of leaderboards) {
      try {
        const stats = await fetchDifficultyStatistics(
          lb.songHash,
          lb.difficulty.difficulty,
          lb.difficulty.characteristic,
        )

        if (stats === null) {
          this.logger.warn(
            `No BeatLeader difficulty statistics for ${lb.songHash} ${lb.difficulty.difficulty} ${lb.difficulty.characteristic}`,
          )
          continue
        }

        await ScoreSaberLeaderboardsRepository.updateLeaderboard(lb.id, {
          crouchWalls: stats.crouchWalls,
          dodgeWalls: stats.dodgeWalls,
        })

        this.logger.info(
          `Updated leaderboard ${lb.id} (${lb.difficulty.difficulty}): crouchWalls=${stats.crouchWalls}, dodgeWalls=${stats.dodgeWalls}`,
        )
      } catch (err) {
        this.logger.error(`Error fetching BeatLeader parity for leaderboard ${lb.id}:`, err)
      }
    }
  }
}
