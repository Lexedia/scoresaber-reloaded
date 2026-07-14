import { z } from 'zod'
import { BeatSaverMapSchema } from '../../beatsaver/map/map'
import { PaginationMetadataSchema } from '../../pagination'
import { ScoreSaberLeaderboardSchema } from '../../scoresaber/leaderboard/leaderboard'
import { ScoreSaberMedalScoreSchema } from '../../scoresaber/score/medal-score'
import { ScoreSaberScoreSchema } from '../../scoresaber/score/score'

export const PlayerScoreEntrySchema = z.object({
  scoreId: z.number(),
  score: z.number(),
  accuracy: z.number(),
  pp: z.number(),
  timestamp: z.date(),
  isCurrent: z.boolean(),
})

export const PlayerScoreSchema = z.object({
  score: ScoreSaberScoreSchema,
  leaderboard: ScoreSaberLeaderboardSchema,
  beatSaver: BeatSaverMapSchema.optional(),
  isHistorical: z.boolean().optional(),
  allPlayerScores: z.array(PlayerScoreEntrySchema).optional(),
})

export const PlayerScoresPageResponseSchema = z.object({
  items: z.array(PlayerScoreSchema),
  metadata: PaginationMetadataSchema,
})

export const MedalPlayerScoreSchema = z.object({
  score: ScoreSaberMedalScoreSchema,
  leaderboard: ScoreSaberLeaderboardSchema,
  beatSaver: BeatSaverMapSchema.optional(),
})

export const MedalPlayerScoresPageResponseSchema = z.object({
  items: z.array(MedalPlayerScoreSchema),
  metadata: PaginationMetadataSchema,
})

export type PlayerScore = z.infer<typeof PlayerScoreSchema>
export type PlayerScoresPageResponse = z.infer<typeof PlayerScoresPageResponseSchema>
export type MedalPlayerScore = z.infer<typeof MedalPlayerScoreSchema>
export type MedalPlayerScoresPageResponse = z.infer<typeof MedalPlayerScoresPageResponseSchema>
