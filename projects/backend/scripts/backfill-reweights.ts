/* eslint-disable @stylistic/max-len */
import type { MapDifficulty } from '@ssr/common/schemas/map/map-difficulty'
import { stripIndent } from '@ssr/common/utils/string.util'
import { and, eq } from 'drizzle-orm'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { db } from '../src/db'
import { scoreSaberLeaderboardStarChangeTable } from '../src/db/schema'
import { ScoreSaberLeaderboardsRepository } from '../src/repositories/scoresaber-leaderboards.repository'

const GITHUB_API_BASE = 'https://api.github.com/repos/ScoreSaber/wiki/contents/content/docs/ranking/reweights'

function normalizeDifficulty(diff: string): MapDifficulty {
  switch (diff.toLowerCase()) {
    case 'expert+':
    case 'expertplus':
      return 'ExpertPlus'
    case 'expert':
      return 'Expert'
    case 'hard':
      return 'Hard'
    case 'normal':
      return 'Normal'
    case 'easy':
      return 'Easy'
    default:
      return diff as MapDifficulty
  }
}

function parseStars(starString: string): number {
  const match = starString.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchDirectory(path: string = ''): Promise<any[]> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`)
  if (!res.ok)
    throw new Error(`Failed to fetch directory ${path}: ${res.statusText}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return res.json() as any
}

async function fetchMarkdown(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`Failed to fetch markdown: ${res.statusText}`)
  return res.text()
}

const rl = readline.createInterface({
  input,
  output,
})

console.log('Fetching root directories...')
const rootItems = await fetchDirectory()
const years = rootItems.filter(item => item.type === 'dir' && /^\d{4}$/.test(item.name))

for (const yearDir of years) {
  console.log(`\nProcessing year: ${yearDir.name}`)
  const files = await fetchDirectory(`/${yearDir.name}`)
  const mdFiles = files.filter(f => f.name.endsWith('.md'))

  for (const file of mdFiles) {
    console.log(`\n-- Processing file: ${file.name} --`)
    const content = await fetchMarkdown(file.download_url)

    const titleMatch = content.match(/title:\s*"(?:.*?-\s*)([^"]+)"/)
    let timestamp = new Date()
    if (titleMatch) {
      timestamp = new Date(titleMatch[1])
      if (isNaN(timestamp.getTime())) {
        console.warn(`Could not parse date from title: ${titleMatch[1]}, using current date.`)
        timestamp = new Date()
      }
    } else {
      console.warn(`Could not find title in ${file.name}, using current date.`)
    }

    const lines = content.split('\n')
    let inTable = false
    for (const line of lines) {
      if (line.trim().startsWith('|') && line.includes('Map Name')) {
        inTable = true
        continue
      }
      if (inTable && line.trim().startsWith('|') && line.includes('---')) {
        continue
      }
      if (inTable && !line.trim().startsWith('|')) {
        inTable = false
        continue
      }

      if (inTable && line.trim().startsWith('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0)
        if (parts.length >= 4) {
          const mapName = parts[0]
          const difficultyStr = parts[1]
          const mapper = parts[2]
          const starsStr = parts[3] // e.g. ⭐ 14.22 → ⭐ 14.24

          const difficulty = normalizeDifficulty(difficultyStr)
          const [ oldStarsStr, newStarsStr ] = starsStr.split('→')
          if (!oldStarsStr || !newStarsStr)
            continue

          const oldStars = parseStars(oldStarsStr)
          const newStars = parseStars(newStarsStr)

          await processReweightRecord(mapName, difficulty, mapper, oldStars, newStars, timestamp)
        }
      }
    }
  }
}

rl.close()
console.log('\nFinished backfilling reweights!')


async function processReweightRecord(
  mapName: string,
  difficulty: MapDifficulty,
  mapper: string,
  oldStars: number,
  newStars: number,
  timestamp: Date,
) {
  const searchQuery = `${mapName} ${mapper}`.trim()
  const candidateIds = await ScoreSaberLeaderboardsRepository.searchLeaderboardIds(searchQuery, 10)

  let leaderboards = await ScoreSaberLeaderboardsRepository.getLeaderboardsByIds(candidateIds)
  leaderboards = leaderboards.filter(lb => lb.difficulty.difficulty === difficulty && lb.stars > 0)

  let selectedLeaderboardId: number | null = null

  if (leaderboards.length === 0) {
    console.log(`\n[Not Found] ${mapName} (${difficulty}) by ${mapper}`)
    const ans = await rl.question('Enter leaderboard ID manually (or press Enter to skip): ')
    if (ans.trim()) {
      selectedLeaderboardId = parseInt(ans.trim(), 10)
    }
  } else if (leaderboards.length === 1) {
    selectedLeaderboardId = leaderboards[0].id
    console.log(`[Auto-Matched] ${mapName} (${difficulty}) -> ID: ${selectedLeaderboardId}, new stars: ${newStars}, old stars: ${oldStars}`)
  } else {
    console.log(`\n[Ambiguous] ${mapName} (${difficulty}) by ${mapper}`)
    console.log('Candidates:')
    leaderboards.forEach((lb, idx) => {
      console.log(stripIndent`  ${idx + 1}. [${lb.id}] ${lb.songName} ${lb.songSubName} (${lb.songAuthorName}) mapped by ${lb.levelAuthorName}
           - Current Stars: ${lb.stars}`)
    })
    const ans = await rl.question('Select a number, enter a specific ID, or press Enter to skip: ')
    const val = parseInt(ans.trim(), 10)
    if (!isNaN(val)) {
      if (val > 0 && val <= leaderboards.length) {
        selectedLeaderboardId = leaderboards[val - 1].id
      } else {
        const manualLb = await ScoreSaberLeaderboardsRepository.getLeaderboardById(val)
        if (manualLb) {
          if (manualLb.difficulty.difficulty === difficulty) {
            selectedLeaderboardId = manualLb.id
          } else {
            const correctDiffLb = await ScoreSaberLeaderboardsRepository.getLeaderboardByHash(
              manualLb.songHash.toLowerCase(),
              difficulty,
              manualLb.difficulty.characteristic,
            )
            if (correctDiffLb) {
              console.log(`[Auto-Corrected] You entered ID ${manualLb.id} (${manualLb.difficulty.difficulty}), auto-corrected to ID ${correctDiffLb.id} (${difficulty}).`)
              selectedLeaderboardId = correctDiffLb.id
            } else {
              console.log(`[Warning] Leaderboard ${val} is ${manualLb.difficulty.difficulty}, and no ${difficulty} diff was found for this song. Using entered ID anyway.`)
              selectedLeaderboardId = val
            }
          }
        } else {
          selectedLeaderboardId = val
        }
      }
    }


  }
  if (selectedLeaderboardId) {
    const existing = await db
      .select()
      .from(scoreSaberLeaderboardStarChangeTable)
      .where(
        and(
          eq(scoreSaberLeaderboardStarChangeTable.leaderboardId, selectedLeaderboardId),
          eq(scoreSaberLeaderboardStarChangeTable.newStars, newStars),
        ),
      )

    if (existing.length === 0) {
      await db.insert(scoreSaberLeaderboardStarChangeTable).values({
        leaderboardId: selectedLeaderboardId,
        previousStars: oldStars,
        newStars: newStars,
        timestamp: timestamp,
      })
      console.log(`  -> Inserted star change for ID ${selectedLeaderboardId}: ${oldStars} -> ${newStars}`)
    } else {
      console.log(`  -> Star change already exists for ID ${selectedLeaderboardId}. Skipping.`)
    }
  } else {
    console.log('  -> Skipped.')

  }
}

