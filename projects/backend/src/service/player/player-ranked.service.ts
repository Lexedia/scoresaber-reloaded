import { ScoreSaberCurve } from '@ssr/common/leaderboard-curve/scoresaber-curve'
import { PlayerPpsResponse } from '@ssr/common/schemas/response/player/player-pps'
import { PpSimulationResponse } from '@ssr/common/schemas/response/player/pp-simulation'
import { updateScoreWeights } from '@ssr/common/utils/scoresaber.util'
import { ScoreSaberScoresRepository } from '../../repositories/scoresaber-scores.repository'
import { PlayerCoreService } from './player-core.service'

export class PlayerRankedService {
  /**
   * Gets the ranked pp scores for a player.
   *
   * @param playerId the player's id
   * @returns the ranked pp scores
   */
  public static async getPlayerPps(playerId: string): Promise<PlayerPpsResponse> {
    await PlayerCoreService.playerExists(playerId, true)

    const playerScores = await ScoreSaberScoresRepository.getPpAndScoreIdByPlayer(playerId)

    if (playerScores.length === 0) {
      return {
        scores: [],
      }
    }

    const scores = playerScores.map(score => ({
      pp: score.pp,
      scoreId: score.scoreId,
      weight: 0,
    }))

    updateScoreWeights(scores) // Set the weights for the scores
    return {
      scores,
    }
  }

  /**
   * Gets the raw pp needed to gain 1 weighted pp for a player.
   *
   * @param playerId the player's id
   * @returns the raw pp needed to gain 1 weighted pp
   */
  public static async getPlayerPlusOnePp(playerId: string): Promise<number> {
    const playerScores = await ScoreSaberScoresRepository.getPpByPlayer(playerId)

    // No ranked score set
    if (playerScores.length === 0) {
      return 0
    }
    return ScoreSaberCurve.calcRawPpForExpectedPp(
      playerScores.map(score => score.pp),
      1,
    )
  }

  /**
   * Simulates the exact amount of weighted PP a player would gain if they set new scores.
   *
   * @param playerId the player's id
   * @param rawPps the raw pp values of the simulated new scores
   * @returns the simulation result
   */
  public static async simulatePpGain(playerId: string, rawPps: number[], realPp?: number): Promise<PpSimulationResponse> {
    const playerScores = await ScoreSaberScoresRepository.getPpByPlayer(playerId)
    const currentScoresPps = playerScores.map(score => score.pp)

    let weightedPpGain = 0
    const simulatedScoresPps = [ ...currentScoresPps ]
    for (const newRawPp of rawPps) {
      const gain = ScoreSaberCurve.getWeightedPpGainForRawPp(simulatedScoresPps, newRawPp)
      weightedPpGain += gain

      const insertIndex = simulatedScoresPps.findIndex(pp => newRawPp > pp)
      if (insertIndex === -1) {
        simulatedScoresPps.push(newRawPp)
      } else {
        simulatedScoresPps.splice(insertIndex, 0, newRawPp)
      }
    }

    // Use the authoritative ScoreSaber PP when available, otherwise fall back to local DB calculation
    const currentTotalPp = realPp ?? ScoreSaberCurve.getTotalWeightedPp(currentScoresPps)
    const newTotalPp = currentTotalPp + weightedPpGain

    return {
      rawPps,
      weightedPpGain,
      newTotalPp,
      currentTotalPp,
    }
  }

  /**
   * Recommends maps to a player based on what other players with similar top plays have played.
   *
   * @param playerId the player's id
   * @param limit maximum number of recommendations
   * @returns map recommendations
   */
  public static async getMapRecommendations(playerId: string, limit: number = 10) {
    const rawRecommendations = await ScoreSaberScoresRepository.getMapRecommendations(playerId, 20, limit)

    return {
      recommendations: rawRecommendations.map(rec => ({
        ...rec,
        coverImage: `https://cdn.beatsaver.com/${rec.songHash.toLowerCase()}.jpg`,
      })),
    }
  }
}
