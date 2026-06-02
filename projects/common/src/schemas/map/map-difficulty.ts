import { z } from 'zod'

export const mapDifficultyShape = z.enum([
  'Easy',
  'Normal',
  'Hard',
  'Expert',
  'ExpertPlus',
]).default('Easy')

export type MapDifficulty = z.infer<typeof mapDifficultyShape>

export const MapDifficultySchema = z
  .string()
  .default('Easy')
  .transform((s): MapDifficulty => s as MapDifficulty)
