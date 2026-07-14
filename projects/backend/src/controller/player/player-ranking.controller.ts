import { PlayerRankingsResponseSchema } from '@ssr/common/schemas/response/player/player-rankings'
import { PlayerMedalRankingsResponseSchema } from '@ssr/common/schemas/response/ranking/medal-rankings'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { PlayerMedalsService } from '../../service/medals/player-medals.service'
import { PlayerSearchService } from '../../service/player/player-search.service'

export default function playerRankingController(app: Elysia) {
  return app.group('/ranking', app =>
    app
      .get(
        '/:page',
        async ({
          params: { page }, query: {
            country, search, includeInactive, hmd,
          },
        }) => {
          return await PlayerSearchService.getPlayerRanking(page, {
            country: country,
            search: search,
            includeInactive: includeInactive,
            hmd: hmd,
          })
        },
        {
          tags: [ 'Ranking' ],
          params: z.object({
            page: z.coerce.number().default(1),
          }),
          query: z.object({
            country: z.string().default('').optional(),
            search: z.string().default('').optional(),
            includeInactive: z.string().optional().transform(v => v === 'true'),
            hmd: z.string().optional(),
          }),
          response: PlayerRankingsResponseSchema,
          detail: {
            description: 'Fetch player ranking',
          },
        },
      )
      .get(
        '/medals/:page',
        async ({ params: { page }, query: { country } }) => {
          return await PlayerMedalsService.getPlayerMedalRanking(page, country)
        },
        {
          tags: [ 'Ranking' ],
          params: z.object({
            page: z.coerce.number().default(1),
          }),
          query: z.object({
            country: z.string().optional(),
          }),
          response: PlayerMedalRankingsResponseSchema,
          detail: {
            description: 'Fetch medal ranking',
          },
        },
      ),
  )
}
