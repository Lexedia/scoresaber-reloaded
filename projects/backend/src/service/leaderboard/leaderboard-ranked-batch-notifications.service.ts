import { env } from '@ssr/common/env'
import Logger, { type ScopedLogger } from '@ssr/common/logger'
import { Playlist } from '@ssr/common/schemas/ssr/playlist/playlist'
import { getDifficulty, getDifficultyName } from '@ssr/common/utils/song-utils'
import { formatDate } from '@ssr/common/utils/time-utils'
import { DiscordChannels, sendFile, sendMessageToChannel } from '../../bot/bot'
import { LeaderboardUpdate } from './leaderboard-ranked-sync.service'

const DISCORD_MESSAGE_LIMIT = 2000

export class LeaderboardRankedSyncNotificationsService {
  private static readonly logger: ScopedLogger = Logger.withTopic('Ranked Batch Notifications')

  /**
   * Logs the ranked batch to Discord.
   */
  public static async handleRankedBatch(updates: LeaderboardUpdate[]): Promise<void> {
    if (updates.length === 0) {
      return
    }

    LeaderboardRankedSyncNotificationsService.logger.info(
      `Handling ranked batch with ${updates.length} updates...`,
    )

    const newlyRankedMaps = updates.filter(
      update => update.newLeaderboard.ranked && !update.previousLeaderboard?.ranked,
    )
    const buffedMaps = updates.filter(
      update =>
        update.previousLeaderboard?.ranked && update.newLeaderboard.ranked &&
        update.newLeaderboard.stars > (update.previousLeaderboard?.stars ?? 0),
    )
    const nerfedMaps = updates.filter(
      update =>
        update.previousLeaderboard?.ranked && update.newLeaderboard.ranked &&
        update.newLeaderboard.stars < (update.previousLeaderboard?.stars ?? 0),
    )

    /**
     * Adds the changes to the changelog, grouping them by song.
     */
    function addChanges(
      changelog: string,
      updates: LeaderboardUpdate[],
      formatStars: (update: LeaderboardUpdate) => string,
    ): string {
      if (updates.length === 0) {
        return changelog
      }

      const grouped = new Map<string, {
        leaderboard: LeaderboardUpdate['newLeaderboard'];
        updates: LeaderboardUpdate[];
      }>()

      for (const update of updates) {
        const hash = update.newLeaderboard.songHash
        if (!grouped.has(hash)) {
          grouped.set(hash, {
            leaderboard: update.newLeaderboard,
            updates: [],
          })
        }
        grouped.get(hash)!.updates.push(update)
      }

      for (const { leaderboard, updates: groupUpdates } of grouped.values()) {
        changelog += `- **${leaderboard.fullName}** by **${leaderboard.levelAuthorName}**\n`

        // Sort by new stars or difficulty
        groupUpdates.sort((a, b) => a.newLeaderboard.stars - b.newLeaderboard.stars)

        for (const update of groupUpdates) {
          const difficulty = getDifficultyName(getDifficulty(update.newLeaderboard.difficulty.difficulty))
          changelog += `  - [${difficulty}] ${formatStars(update)}\n`
        }
      }
      return changelog
    }

    /**
     * Formats previous stars for changelog entries.
     */
    function formatPreviousStars(update: LeaderboardUpdate): string {
      return update.previousLeaderboard?.stars?.toFixed(2) ?? 'unranked'
    }

    let changelog = ''

    // Newly ranked maps
    if (newlyRankedMaps.length > 0) {
      changelog += '### 🌟 Newly Ranked\n'
      changelog = addChanges(changelog, newlyRankedMaps, update => {
        return `⭐ **${update.newLeaderboard.stars.toFixed(2)}**`
      })
      changelog += '\n'
    }

    // Buffed maps
    if (buffedMaps.length > 0) {
      changelog += '### 📈 Buffed\n'
      changelog = addChanges(changelog, buffedMaps, update => {
        return `⭐ ${formatPreviousStars(update)} ➔ **${update.newLeaderboard.stars.toFixed(2)}**`
      })
      changelog += '\n'
    }

    // Nerfed maps
    if (nerfedMaps.length > 0) {
      changelog += '### 📉 Nerfed\n'
      changelog = addChanges(changelog, nerfedMaps, update => {
        return `⭐ ${formatPreviousStars(update)} ➔ **${update.newLeaderboard.stars.toFixed(2)}**`
      })
      changelog += '\n'
    }

    const role = `<@&${env.DISCORD_ROLE_RANKED_BATCH}>`
    const header = 'New Ranked Batch'
    const fullMessage = `${role} ${header}:\n\n${changelog}`

    if (fullMessage.length <= DISCORD_MESSAGE_LIMIT) {
      await sendMessageToChannel(DiscordChannels.RANKED_BATCH_LOGS, fullMessage)
    } else {
      const date = formatDate(new Date(), 'DD-MM-YYYY')
      await sendFile(
        DiscordChannels.RANKED_BATCH_LOGS,
        `ranked-batch-changelog-${date}.md`,
        changelog,
        `${role} ${header}`,
      )
    }

    // Create a playlist of the changes
    const playlist: Playlist = {
      playlistTitle: `Ranked Batch (${formatDate(new Date(), 'MMM D, YYYY')})`,
      playlistAuthor: env.NEXT_PUBLIC_WEBSITE_NAME,
      songs: newlyRankedMaps.map(update => ({
        songName: update.newLeaderboard.songName,
        levelAuthorName: update.newLeaderboard.levelAuthorName,
        hash: update.newLeaderboard.songHash,
        difficulties: update.newLeaderboard.difficulties.map(difficulty => ({
          difficulty: difficulty.difficulty,
          characteristic: difficulty.characteristic,
        })),
      })),
    }

    const date = formatDate(new Date(), 'DD-MM-YYYY')
    await sendFile(
      DiscordChannels.RANKED_BATCH_LOGS,
      `scoresaber-ranked-batch-${date}.bplist`,
      JSON.stringify(playlist, null, 2),
    )
  }
}
