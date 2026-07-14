import { z } from 'zod'

export const RecommendedMapSchema = z.object({
  leaderboardId: z.coerce.number(),
  frequency: z.coerce.number(),
  averagePp: z.coerce.number(),
  stars: z.coerce.number(),
  songName: z.string(),
  songSubName: z.string(),
  songAuthorName: z.string(),
  levelAuthorName: z.string(),
  difficulty: z.string(),
  coverImage: z.string(),
})

export const MapRecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendedMapSchema),
})

export type RecommendedMap = z.infer<typeof RecommendedMapSchema>
export type MapRecommendationsResponse = z.infer<typeof MapRecommendationsResponseSchema>
