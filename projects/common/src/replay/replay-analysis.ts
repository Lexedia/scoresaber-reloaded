import { NoteCutInfo, NoteEventType, Replay, ReplayNote } from './replay-decoder'

export interface MissGridCell {
  lineIndex: number
  lineLayer: number
  missCount: number
  totalNotes: number
}

export interface CutMetrics {
  count: number
  averageTimeDeviation: number
  averageCutDirDeviation: number
  averageBeforeCutRating: number
  averageAfterCutRating: number
  averageCutAngle: number
  averageSaberSpeed: number
  averageCutDistanceToCenter: number
}

export interface HandCutMetrics {
  left: CutMetrics
  right: CutMetrics
  overall: CutMetrics
}

export interface MissGridAnalysis {
  grid: number[]
  total: number[]
}

export interface ReplayAnalysis {
  missGrid: MissGridAnalysis
  cutMetrics: HandCutMetrics
}

function emptyCutMetrics(): CutMetrics {
  return {
    count: 0,
    averageTimeDeviation: 0,
    averageCutDirDeviation: 0,
    averageBeforeCutRating: 0,
    averageAfterCutRating: 0,
    averageCutAngle: 0,
    averageSaberSpeed: 0,
    averageCutDistanceToCenter: 0,
  }
}

function accumulateCutMetrics(acc: CutMetrics, info: NoteCutInfo): void {
  const n = acc.count
  acc.averageTimeDeviation = (acc.averageTimeDeviation * n + info.timeDeviation) / (n + 1)
  acc.averageCutDirDeviation = (acc.averageCutDirDeviation * n + info.cutDirDeviation) / (n + 1)
  acc.averageBeforeCutRating = (acc.averageBeforeCutRating * n + info.beforeCutRating) / (n + 1)
  acc.averageAfterCutRating = (acc.averageAfterCutRating * n + info.afterCutRating) / (n + 1)
  acc.averageCutAngle = (acc.averageCutAngle * n + info.cutAngle) / (n + 1)
  acc.averageSaberSpeed = (acc.averageSaberSpeed * n + info.saberSpeed) / (n + 1)
  acc.averageCutDistanceToCenter = (acc.averageCutDistanceToCenter * n + info.cutDistanceToCenter) / (n + 1)
  acc.count = n + 1
}

export function parseNoteID(noteID: number): {
  scoringType: number
  colorType: number
  lineIndex: number
  lineLayer: number
  cutDirection: number
} {
  const id = Math.abs(noteID)
  const cutDirection = id % 10
  const colorType = Math.floor(id / 10) % 10
  const lineLayer = Math.floor(id / 100) % 10
  const lineIndex = Math.floor(id / 1000) % 10
  const scoringType = Math.floor(id / 10000)
  return { scoringType, colorType, lineIndex, lineLayer, cutDirection }
}

const GRID_COLS = 4

function gridIndex(lineLayer: number, lineIndex: number): number {
  const displayRow = 2 - lineLayer
  return displayRow * GRID_COLS + lineIndex
}

export function analyzeReplay(replay: Replay): ReplayAnalysis {
  const grid = new Array(12).fill(0)
  const total = new Array(12).fill(0)

  const leftMetrics = emptyCutMetrics()
  const rightMetrics = emptyCutMetrics()

  for (const note of replay.notes) {
    const { lineLayer, lineIndex, colorType } = parseNoteID(note.noteID)
    const idx = gridIndex(lineLayer, lineIndex)

    if (idx >= 0 && idx < 12) {
      total[idx]++
      if (note.eventType === NoteEventType.miss) {
        grid[idx]++
      }
    }

    if (note.noteCutInfo && (note.eventType === NoteEventType.good || note.eventType === NoteEventType.bad)) {
      if (note.noteCutInfo.saberType === 0) {
        accumulateCutMetrics(leftMetrics, note.noteCutInfo)
      } else {
        accumulateCutMetrics(rightMetrics, note.noteCutInfo)
      }
    }
  }

  const totalLeftCuts = leftMetrics.count
  const totalRightCuts = rightMetrics.count

  const overall: CutMetrics = {
    count: totalLeftCuts + totalRightCuts,
    averageTimeDeviation: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageTimeDeviation * totalLeftCuts + rightMetrics.averageTimeDeviation * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
    averageCutDirDeviation: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageCutDirDeviation * totalLeftCuts + rightMetrics.averageCutDirDeviation * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
    averageBeforeCutRating: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageBeforeCutRating * totalLeftCuts + rightMetrics.averageBeforeCutRating * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
    averageAfterCutRating: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageAfterCutRating * totalLeftCuts + rightMetrics.averageAfterCutRating * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
    averageCutAngle: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageCutAngle * totalLeftCuts + rightMetrics.averageCutAngle * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
    averageSaberSpeed: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageSaberSpeed * totalLeftCuts + rightMetrics.averageSaberSpeed * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
    averageCutDistanceToCenter: totalLeftCuts + totalRightCuts > 0
      ? (leftMetrics.averageCutDistanceToCenter * totalLeftCuts + rightMetrics.averageCutDistanceToCenter * totalRightCuts) / (totalLeftCuts + totalRightCuts)
      : 0,
  }

  return {
    missGrid: { grid, total },
    cutMetrics: { left: leftMetrics, right: rightMetrics, overall },
  }
}
