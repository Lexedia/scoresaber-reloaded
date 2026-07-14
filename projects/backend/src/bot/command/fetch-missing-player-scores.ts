import { IsGuildUser } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import {
  Discord, Guard, Slash, SlashOption,
} from 'discordx'
import { FetchMissingScoresQueue } from '../../queue/impl/player-scoresaber-scores-queue'
import { QueueId, QueueManager } from '../../queue/queue-manager'
import { ScoreSaberAccountsRepository } from '../../repositories/scoresaber-accounts.repository'
import { ScoreSaberApiService } from '../../service/external/scoresaber-api.service'
import { PlayerCoreService } from '../../service/player/player-core.service'
import { PlayerScoresService } from '../../service/player/player-scores.service'
import { OwnerOnly } from '../lib/guards'

@Discord()
@Guard(IsGuildUser(OwnerOnly))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class FetchMissingPlayerScores {
  @Slash({
    description: 'Force fetch missing scores for a player or all players',
    name: 'fetch-missing-player-scores',
  })
  async fetchMissingPlayerScores(
    @SlashOption({
      description: 'The player\'s id to refresh the scores for',
      name: 'player',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    playerId: string,
    @SlashOption({
      description: 'Force scan all pages and update drifted scores',
      name: 'force',
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    force: boolean = false,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply()
    try {
      if (!playerId) {
        const players = await ScoreSaberAccountsRepository.selectAllIds()
        const playerIds = players.map(p => p.id)
        if (playerIds.length === 0) {
          await interaction.editReply({
            content: 'No players to fetch missing scores for',
          })
          return
        }
        for (const playerId of playerIds) {
          await (QueueManager.getQueue(QueueId.PlayerScoreRefreshQueue) as FetchMissingScoresQueue).add({
            id: playerId,
            data: playerId,
          })
        }
        await interaction.editReply({
          content: `Added ${playerIds.length} players to the fetch missing scores queue`,
        })
        return
      }

      const playerToken = await ScoreSaberApiService.lookupPlayer(playerId)
      if (!playerToken) {
        throw new Error('Player not found')
      }

      const account = await PlayerCoreService.getOrCreateAccount(playerId, playerToken)
      await PlayerScoresService.fetchMissingPlayerScores(account, playerToken, force)

      await interaction.editReply({
        content: `Fetching missing scores for ${playerToken.name}${force ? ' (force)' : ''}...`,
      })
    } catch (error) {
      await interaction.editReply({
        content: error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }
}
