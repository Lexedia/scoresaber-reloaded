import { z } from 'zod'

export const PlayerScoreChartDataPointSchema = z.object({
  accuracy: z.number(),
  stars: z.number(),
  pp: z.number(),
  timestamp: z.date(),
  leaderboardId: z.number(),
  leaderboardName: z.string(),
  leaderboardDifficulty: z.string(),
  characteristic: z.string().optional(),
})

export const PlayerScoresChartResponseSchema = z.object({
  data: z.array(PlayerScoreChartDataPointSchema),
})

export const DifficultyCurvePointSchema = z.object({
  bin: z.string(),
  minStars: z.number(),
  maxStars: z.number(),
  avgAccuracy: z.number(),
  avgPp: z.number(),
  maxPp: z.number(),
  scoreCount: z.number(),
})

export const DifficultyCurveResponseSchema = z.object({
  data: z.array(DifficultyCurvePointSchema),
})

export const SkillBreakdownCategorySchema = z.object({
  characteristic: z.string(),
  difficulty: z.string(),
  label: z.string(),
  scoreCount: z.number(),
  totalPp: z.number(),
  avgAccuracy: z.number(),
  avgStars: z.number(),
})

export const SkillBreakdownResponseSchema = z.object({
  data: z.array(SkillBreakdownCategorySchema),
})

export type PlayerScoreChartDataPoint = z.infer<typeof PlayerScoreChartDataPointSchema>
export type PlayerScoresChartResponse = z.infer<typeof PlayerScoresChartResponseSchema>
export type DifficultyCurvePoint = z.infer<typeof DifficultyCurvePointSchema>
export type DifficultyCurveResponse = z.infer<typeof DifficultyCurveResponseSchema>
export type SkillBreakdownCategory = z.infer<typeof SkillBreakdownCategorySchema>
export type SkillBreakdownResponse = z.infer<typeof SkillBreakdownResponseSchema>
