import { IsGuildUser } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import {
  Discord, Guard, Slash, SlashOption,
} from 'discordx'
import { PlayerBeatLeaderScoreSeedQueue } from '../../queue/impl/player-beatleader-score-seed-queue'
import { QueueId, QueueManager } from '../../queue/queue-manager'
import { ScoreSaberAccountsRepository } from '../../repositories/scoresaber-accounts.repository'
import { PlayerCoreService } from '../../service/player/player-core.service'
import { OwnerOnly } from '../lib/guards'

@Discord()
@Guard(IsGuildUser(OwnerOnly))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ReseedBeatLeaderScores {
  @Slash({
    description: 'Reseed BeatLeader scores for a player or all players',
    name: 'reseed-beatleader-scores',
  })
  async reseedBeatLeaderScores(
    @SlashOption({
      description: 'The player\'s id to reseed BeatLeader scores for',
      name: 'player',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    playerId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply()
    try {
      if (playerId) {
        const account = await PlayerCoreService.getAccount(playerId)
        if (!account) {
          await interaction.editReply({
            content: `Player "${playerId}" not found in the database`,
          })
          return
        }

        await PlayerCoreService.updatePlayer(playerId, { seededBeatLeaderScores: false })
        await (QueueManager.getQueue(QueueId.PlayerBeatLeaderScoreSeedQueue) as PlayerBeatLeaderScoreSeedQueue).add({
          id: playerId,
          data: playerId,
        })

        await interaction.editReply({
          content: `Reseeded BeatLeader scores for ${account.name} (${playerId})`,
        })
        return
      }

      // Reseed all players
      const allPlayers = await ScoreSaberAccountsRepository.selectAllIds()
      if (allPlayers.length === 0) {
        await interaction.editReply({
          content: 'No players to reseed BeatLeader scores for',
        })
        return
      }

      // Reset all players' seededBeatLeaderScores flag
      const queue = QueueManager.getQueue(QueueId.PlayerBeatLeaderScoreSeedQueue) as PlayerBeatLeaderScoreSeedQueue
      let addedCount = 0
      for (const player of allPlayers) {
        await PlayerCoreService.updatePlayer(player.id, { seededBeatLeaderScores: false })
        await queue.add({
          id: player.id,
          data: player.id,
        })
        addedCount++
      }

      await interaction.editReply({
        content: `Reseeded BeatLeader scores for all ${addedCount} players`,
      })
    } catch (error) {
      await interaction.editReply({
        content: error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }
}
