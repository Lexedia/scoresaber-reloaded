import { ScoreSaberScore } from '@ssr/common/schemas/scoresaber/score/score'

export interface SessionScore {
  score: ScoreSaberScore
}

export interface SessionSummary {
  id: string
  scores: SessionScore[]
  startTime: Date
  endTime: Date
  totalPP: number
  averageAccuracy: number
  totalNotesHit: number
  accuracyTrend: {
    time: number;
    accuracy: number
  }[]
}

const SESSION_GAP_MINUTES = 120

export function detectSessions(scores: ScoreSaberScore[]): SessionSummary[] {
  if (scores.length === 0)
    return []

  const sorted = [ ...scores ].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  const groups: ScoreSaberScore[][] = []
  let current: ScoreSaberScore[] = [ sorted[0] ]

  for (let i = 1; i < sorted.length; i++) {
    const gap =
      new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()
    if (gap > SESSION_GAP_MINUTES * 60 * 1000) {
      groups.push(current)
      current = []
    }
    current.push(sorted[i])
  }
  if (current.length > 0)
    groups.push(current)

  return groups.map(computeSessionSummary).reverse()
}

function computeSessionSummary(scores: ScoreSaberScore[]): SessionSummary {
  const totalPP = scores.reduce((sum, s) => sum + s.pp, 0)
  const averageAccuracy =
    scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length

  const totalNotesHit = scores.reduce((sum, s) => sum + s.maxCombo, 0)

  const accuracyTrend = scores.map(s => ({
    time: new Date(s.timestamp).getTime(),
    accuracy: s.accuracy,
  }))

  const startTime = new Date(scores[0].timestamp)
  const endTime = new Date(scores[scores.length - 1].timestamp)

  return {
    id: startTime.getTime().toString(),
    scores: scores.map(s => ({ score: s })),
    startTime,
    endTime,
    totalPP,
    averageAccuracy,
    totalNotesHit,
    accuracyTrend,
  }
}

export function formatSessionDuration(start: Date, end: Date): string {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
  if (minutes < 60)
    return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function formatSessionDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
