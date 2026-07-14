import { z } from 'zod'

export const PlayerWrappedTopPlaySchema = z.object({
  leaderboardId: z.number(),
  scoreId: z.number(),
  pp: z.number(),
  accuracy: z.number(),
  rank: z.number(),
  fullCombo: z.boolean(),
  timestamp: z.date(),
  songName: z.string(),
  songHash: z.string(),
  stars: z.number(),
  difficulty: z.string(),
  characteristic: z.string(),
  maxCombo: z.number().optional(),
  missedNotes: z.number().optional(),
  badCuts: z.number().optional(),
})

export const PlayerWrappedResponseSchema = z.object({
  playerId: z.string(),
  year: z.number(),

  // Score & play stats for the year
  totalPlays: z.number(),
  totalRankedPlays: z.number(),
  totalUnrankedPlays: z.number(),

  // Accuracy grade play counts (ranked only)
  godPlays: z.number(),
  sspPlays: z.number(),
  ssPlays: z.number(),
  spPlays: z.number(),
  sPlays: z.number(),
  aPlays: z.number(),
  averageAccuracy: z.number(),

  // Top play set in that year (highest PP, ranked)
  topPlay: PlayerWrappedTopPlaySchema.nullable(),

  // Player progression (from daily history snapshots)
  rankStart: z.number().nullable(),
  rankEnd: z.number().nullable(),
  ppStart: z.number().nullable(),
  ppEnd: z.number().nullable(),
  ppGained: z.number(),

  // Active days in the year
  activeDays: z.number(),

  topMapper: z.string().nullable(),
  topMapperPlays: z.number().nullable(),
  topMapperAvatar: z.string().nullable().optional(),
  topHmd: z.string().nullable(),
  topHmdPlays: z.number().nullable(),
  totalPlaySeconds: z.number(),
  biggestCombo: PlayerWrappedTopPlaySchema.nullable(),
  worstChoke: PlayerWrappedTopPlaySchema.nullable(),
  topStyle: z.string().nullable(),
  topStylePlays: z.number().nullable(),
})

export type PlayerWrappedTopPlay = z.infer<typeof PlayerWrappedTopPlaySchema>
export type PlayerWrappedResponse = z.infer<typeof PlayerWrappedResponseSchema>
