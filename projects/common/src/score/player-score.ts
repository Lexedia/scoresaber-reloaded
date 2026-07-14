import { BeatSaverMap } from '../schemas/beatsaver/map/map'
import { ScoreSaberLeaderboard } from '../schemas/scoresaber/leaderboard/leaderboard'

export interface PlayerScoreEntry {
  scoreId: number;
  score: number;
  accuracy: number;
  pp: number;
  timestamp: Date;
  isCurrent: boolean;
}

export interface PlayerScore<T> {
  /**
   * The score.
   */
  readonly score: T;

  /**
   * The leaderboard the score was set on.
   */
  readonly leaderboard: ScoreSaberLeaderboard;

  /**
   * The BeatSaver of the song.
   */
  readonly beatSaver?: BeatSaverMap;

  /**
   * Whether this score is a historical (previous) score, not the current one on the leaderboard.
   */
  readonly isHistorical?: boolean;

  /**
   * All scores (current + history) for this player on this leaderboard, for version switching.
   */
  readonly allPlayerScores?: PlayerScoreEntry[];
}
