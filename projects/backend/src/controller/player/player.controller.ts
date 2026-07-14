import { DetailTypeSchema } from '@ssr/common/detail-type'
import { NotFoundError } from '@ssr/common/error/not-found-error'
import { MapRecommendationsResponseSchema } from '@ssr/common/schemas/response/player/map-recommendations'
import { PlayerPpsResponseSchema } from '@ssr/common/schemas/response/player/player-pps'
import { PlayerRefreshResponseSchema } from '@ssr/common/schemas/response/player/player-refresh'
import { PlayerWrappedResponseSchema } from '@ssr/common/schemas/response/player/player-wrapped'
import { PpSimulationResponseSchema } from '@ssr/common/schemas/response/player/pp-simulation'
import {
  DifficultyCurveResponseSchema,
  PlayerScoresChartResponseSchema,
  SkillBreakdownResponseSchema,
} from '@ssr/common/schemas/response/player/scores-chart'
import { ScoreSaberScoresPageResponseSchema } from '@ssr/common/schemas/response/score/scoresaber-scores-page'
import { Elysia } from 'elysia'
import { z } from 'zod'
import { ScoreSaberApiService } from '../../service/external/scoresaber-api.service'
import { PlayerStatisticsService } from '../../service/player-statistics/player-statistics.service'
import MiniRankingService from '../../service/player/mini-ranking.service'
import { PlayerCoreService } from '../../service/player/player-core.service'
import { PlayerHistoryService } from '../../service/player/player-history.service'
import { PlayerRankedService } from '../../service/player/player-ranked.service'
import { PlayerScoreHistoryService } from '../../service/player/player-score-history.service'
import { PlayerScoresService } from '../../service/player/player-scores.service'
import { PlayerSearchService } from '../../service/player/player-search.service'
import { PlayerWrappedService } from '../../service/player/player-wrapped.service'
import ScoreSaberPlayerService from '../../service/player/scoresaber-player.service'

export default function playerController(app: Elysia) {
  return app.group('/player', app =>
    app
      .get(
        '/:playerId',
        async ({ params: { playerId }, query: { type } }) => {
          return ScoreSaberPlayerService.getPlayer(playerId, type)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          query: z.object({
            type: z.optional(DetailTypeSchema),
          }),
          detail: {
            description: 'Fetch ScoreSaber player profile',
          },
        },
      )
      .get(
        '/scores-chart/:playerId',
        async ({ params: { playerId } }) => {
          return PlayerScoresService.getPlayerScoreChart(playerId)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          response: PlayerScoresChartResponseSchema,
          detail: {
            description: 'Fetch player score chart data',
          },
        },
      )
      .get(
        '/difficulty-curve/:playerId',
        async ({ params: { playerId } }) => {
          return PlayerScoresService.getPlayerDifficultyCurve(playerId)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          response: DifficultyCurveResponseSchema,
          detail: {
            description: 'Fetch player difficulty curve data',
          },
        },
      )
      .get(
        '/skill-breakdown/:playerId',
        async ({ params: { playerId } }) => {
          return PlayerScoresService.getPlayerSkillBreakdown(playerId)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          response: SkillBreakdownResponseSchema,
          detail: {
            description: 'Fetch player skill breakdown by characteristic and difficulty',
          },
        },
      )
      .get(
        '/pps/:playerId',
        async ({ params: { playerId } }) => {
          return PlayerRankedService.getPlayerPps(playerId)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          response: PlayerPpsResponseSchema,
          detail: {
            description: 'Fetch player PP values',
          },
        },
      )
      .get(
        '/refresh/:playerId',
        async ({ params: { playerId } }) => {
          return PlayerCoreService.refreshPlayer(playerId)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          response: PlayerRefreshResponseSchema,
          detail: {
            description: 'Refresh player data from ScoreSaber',
          },
        },
      )
      .get(
        '/mini-ranking/:playerId',
        async ({ params: { playerId } }) => {
          return MiniRankingService.getPlayerMiniRankings(playerId)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          detail: {
            description: 'Fetch player mini-ranking',
          },
        },
      )
      .get(
        '/search',
        async ({ query: { query } }) => {
          const normalizedQuery = query?.trim()
          return {
            players: await PlayerSearchService.searchPlayers(normalizedQuery),
          }
        },
        {
          tags: [ 'Player' ],
          query: z.object({
            // Allow empty string searches (`?query=`) but cap length to avoid unbounded query costs.
            query: z.string().max(64).optional(),
          }),
          detail: {
            description: 'Search players',
          },
        },
      )
      .get(
        '/history/:playerId',
        async ({ params: { playerId }, query: { count, from, to } }) => {
          const player = await ScoreSaberApiService.lookupPlayer(playerId)
          if (!player) {
            throw new NotFoundError(`Player "${playerId}" not found`)
          }
          const statistics = await PlayerStatisticsService.getStatistics(player)
          return await PlayerHistoryService.getPlayerStatisticHistories(player, statistics, count, from, to)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          query: z.object({
            count: z.preprocess(
              v => (v === '' || v === undefined ? 50 : Number(v)),
              z.union([
                z.literal(-1),
                z.number().int().min(1),
              ]),
            ),
            from: z.string().date().optional(),
            to: z.string().date().optional(),
          }),
          detail: {
            description: 'Fetch player statistics history',
          },
        },
      )
      .get(
        '/score-history/:playerId/:leaderboardId/:page',
        async ({ params: { playerId, leaderboardId, page } }) => {
          return await PlayerScoreHistoryService.getPlayerScoreHistory(playerId, leaderboardId, page)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
            leaderboardId: z.coerce.number(),
            page: z.coerce.number(),
          }),
          response: ScoreSaberScoresPageResponseSchema,
          detail: {
            description: 'Fetch player score history for a leaderboard',
          },
        },
      )
      .post(
        '/simulate-pp/:playerId',
        async ({ params: { playerId }, body: { rawPps, realPp } }) => {
          return await PlayerRankedService.simulatePpGain(playerId, rawPps, realPp)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          body: z.object({
            rawPps: z.array(z.number()),
            realPp: z.number().optional(),
          }),
          response: PpSimulationResponseSchema,
          detail: {
            description: 'Simulate exact PP gain if a player sets new scores',
          },
        },
      )
      .get(
        '/recommendations/:playerId',
        async ({ params: { playerId }, query: { limit } }) => {
          return await PlayerRankedService.getMapRecommendations(playerId, limit)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
          }),
          query: z.object({
            limit: z.coerce.number().optional().default(10),
          }),
          response: MapRecommendationsResponseSchema,
          detail: {
            description: 'Get map recommendations based on top plays',
          },
        },
      )
      .get(
        '/wrapped/:playerId/:year',
        async ({ params: { playerId, year } }) => {
          return await PlayerWrappedService.getWrapped(playerId, year)
        },
        {
          tags: [ 'Player' ],
          params: z.object({
            playerId: z.string(),
            year: z.coerce.number().int().min(2000).max(2100),
          }),
          response: PlayerWrappedResponseSchema,
          detail: {
            description: 'Get a "Wrapped" yearly summary for a player',
          },
        },
      ),
  )
}
