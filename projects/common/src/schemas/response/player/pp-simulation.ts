import { z } from 'zod'

export const PpSimulationResponseSchema = z.object({
  rawPps: z.array(z.number()),
  weightedPpGain: z.number(),
  newTotalPp: z.number(),
  currentTotalPp: z.number(),
})

export type PpSimulationResponse = z.infer<typeof PpSimulationResponseSchema>
