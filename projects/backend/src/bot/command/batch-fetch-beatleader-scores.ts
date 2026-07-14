import { IsGuildUser } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import {
  Discord, Guard, Slash, SlashOption,
} from 'discordx'
import { BeatLeaderScoresRepository } from '../../repositories/beatleader-scores.repository'
import { ScoreSaberScoresRepository } from '../../repositories/scoresaber-scores.repository'
import BeatLeaderService from '../../service/beatleader/beatleader.service'
import { PlayerCoreService } from '../../service/player/player-core.service'
import { OwnerOnly } from '../lib/guards'

@Discord()
@Guard(IsGuildUser(OwnerOnly))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class BatchFetchBeatLeaderScores {
  @Slash({
    description: 'Batch-fetch BeatLeader scores for a player from ssr-api.fascinated.cc',
    name: 'batch-fetch-beatleader-scores',
  })
  async batchFetchBeatLeaderScores(
    @SlashOption({
      description: 'The player\'s id',
      name: 'player',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    playerId: string,

    @SlashOption({
      description: 'Max scores to process (0 = all)',
      name: 'limit',
      required: false,
      type: ApplicationCommandOptionType.Integer,
    })
    limit: number | undefined,

    @SlashOption({
      description: 'Concurrent fetches (default 5)',
      name: 'concurrency',
      required: false,
      type: ApplicationCommandOptionType.Integer,
    })
    concurrency: number | undefined,

    interaction: CommandInteraction,
  ) {
    await interaction.deferReply()

    const maxConcurrency = Math.max(1, Math.min(concurrency ?? 5, 20))
    const maxScores = limit ?? 0

    try {
      const account = await PlayerCoreService.getAccount(playerId)
      if (!account) {
        await interaction.editReply({ content: `Player "${playerId}" not found in the database` })
        return
      }

      const allScores = await ScoreSaberScoresRepository.getScoreIdsByPlayerId(playerId)
      if (allScores.length === 0) {
        await interaction.editReply({ content: `No ScoreSaber scores found for ${account.name} (${playerId})` })
        return
      }

      const allScoreIds = allScores.map(s => s.scoreId)
      const existingIds = await BeatLeaderScoresRepository.findExistingIds(allScoreIds)

      const missing = allScores.filter(s => !existingIds.has(s.scoreId))
      if (missing.length === 0) {
        await interaction.editReply({ content: `All ${allScores.length} scores already have BeatLeader data for ${account.name}` })
        return
      }

      const toProcess = maxScores > 0 ? missing.slice(0, maxScores) : missing
      const total = toProcess.length
      let processed = 0
      let fetched = 0
      let errors = 0

      await interaction.editReply({
        content: `Batch-fetching BeatLeader scores for ${account.name}…\n` +
          `${allScores.length} total scores, ${missing.length} missing, processing ${total}`,
      })

      const chunks: {
        scoreId: number;
        score: number
      }[][] = []
      for (let i = 0; i < total; i += maxConcurrency) {
        chunks.push(toProcess.slice(i, i + maxConcurrency))
      }

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(s => BeatLeaderService.fetchFromMainInstance(s.scoreId, s.score)),
        )

        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            fetched++
          } else {
            errors++
          }
        }

        processed += chunk.length

        if (processed % 50 === 0 || processed === total) {
          await interaction.editReply({
            content: `Batch-fetching BeatLeader scores for ${account.name}…\n` +
              `Progress: ${processed}/${total} | Fetched: ${fetched} | Errors: ${errors}`,
          })
        }
      }

      await interaction.editReply({
        content: `Done. Fetched ${fetched} BeatLeader scores for ${account.name} (${playerId})\n` +
          `${processed} processed, ${errors} errors, ${total - fetched - errors} not found on main instance`,
      })
    } catch (error) {
      await interaction.editReply({
        content: error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }
}
