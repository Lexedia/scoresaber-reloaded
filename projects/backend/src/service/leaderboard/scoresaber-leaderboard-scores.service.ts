import { NotFoundError } from '@ssr/common/error/not-found-error'
import LeaderboardScoresResponse from '@ssr/common/schemas/response/leaderboard/leaderboard-scores'
import type { ScoreSaberScoreSortField } from '@ssr/common/schemas/score/query/sort/scoresaber-scores-sort'
import type { SortDirection } from '@ssr/common/schemas/score/query/sort/sort-direction'
import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'
import { getScoreSaberScoreFromToken } from '@ssr/common/token-creators'
import { ScoreSaberScoresRepository } from '../../repositories/scoresaber-scores.repository'
import BeatSaverService from '../external/beatsaver.service'
import { ScoreSaberApiService } from '../external/scoresaber-api.service'
import { ScoreCoreService } from '../score/score-core.service'
import { ScoreSaberLeaderboardsService } from './scoresaber-leaderboards.service'

export class ScoreSaberLeaderboardScoresService {
  /**
   * Gets scores for a leaderboard.
   *
   * @param leaderboardId the leaderboard id
   * @param page the page to get
   * @param country the country to get scores in
   * @param sort the sort field
   * @param direction the sort direction
   * @returns the scores
   */
  public static async getLeaderboardScores(
    leaderboardId: number,
    page: number,
    country?: string,
    hmd?: string,
    sort?: ScoreSaberScoreSortField,
    direction?: SortDirection,
  ): Promise<LeaderboardScoresResponse | undefined> {
    const leaderboard = await ScoreSaberLeaderboardsService.getLeaderboard(leaderboardId)
    if (leaderboard == undefined) {
      throw new NotFoundError(`Leaderboard "${leaderboardId}" not found`)
    }

    const itemsPerPage = 12

    if (hmd || sort) {
      const { scores: rawScores, total } = await ScoreSaberScoresRepository.getLeaderboardScoresPaginated(
        leaderboardId,
        page,
        itemsPerPage,
        country,
        hmd,
        sort,
        direction,
      )

      const scores = (
        await Promise.all(
          rawScores.map(score =>
            ScoreCoreService.insertScoreData(score, leaderboard, {
              insertBeatLeaderScore: true,
              insertPlayerInfo: true,
              insertPreviousScore: false,
            }),
          ),
        )
      ).filter(score => score !== undefined) as ScoreSaberScore[]

      const totalPages = Math.ceil(total / itemsPerPage)

      return {
        scores,
        leaderboard,
        beatSaver: await BeatSaverService.getMap(
          leaderboard.songHash,
          leaderboard.difficulty.difficulty,
          leaderboard.difficulty.characteristic,
        ),
        metadata: {
          totalPages,
          totalItems: total,
          page,
          itemsPerPage,
        },
      }
    }

    const leaderboardScores = await ScoreSaberApiService.lookupLeaderboardScores(leaderboardId, page, {
      country: country,
    })
    if (!leaderboardScores) {
      throw new NotFoundError(`Leaderboard scores for leaderboard "${leaderboardId}" not found`)
    }

    const parsedScores = leaderboardScores.scores.map(token =>
      getScoreSaberScoreFromToken(token, leaderboard, token.leaderboardPlayerInfo.id),
    )

    void ScoreSaberScoresRepository.batchPatchRanks(
      leaderboardScores.scores
        .filter(t => t.id != null && t.rank > 0)
        .map(t => ({
          scoreId: parseInt(t.id),
          rank: t.rank,
        }))
        .filter(u => !isNaN(u.scoreId)),
    )

    const scores = (
      await Promise.all(
        parsedScores.map(score => {
          if (score === undefined) {
            return undefined
          }
          return ScoreCoreService.insertScoreData(score, leaderboard, {
            insertBeatLeaderScore: true,
            insertPlayerInfo: true,
            insertPreviousScore: false,
          })
        }),
      )
    ).filter(score => score !== undefined) as ScoreSaberScore[]

    const totalPages = Math.ceil(leaderboardScores.metadata.total / leaderboardScores.metadata.itemsPerPage)

    return {
      scores,
      leaderboard: leaderboard,
      beatSaver: await BeatSaverService.getMap(
        leaderboard.songHash,
        leaderboard.difficulty.difficulty,
        leaderboard.difficulty.characteristic,
      ),
      metadata: {
        totalPages,
        totalItems: leaderboardScores.metadata.total,
        page: leaderboardScores.metadata.page,
        itemsPerPage: leaderboardScores.metadata.itemsPerPage,
      },
    }
  }
}
