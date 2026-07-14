'use client'

import SimpleTooltip from '@/components/simple-tooltip'
import { Spinner } from '@/components/spinner'
import { Slider } from '@/components/ui/slider'
import ScoreSaberPlayer from '@ssr/common/player/impl/scoresaber-player'
import { formatPp } from '@ssr/common/utils/number-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'


const VW = 100
const VH = 86.6

const OUTER_TECH = {
  x: 0,
  y: 0,
}

const OUTER_ACC = {
  x: VW,
  y: 0,
}

const OUTER_PASS = {
  x: VW / 2,
  y: VH,
}

const CENTER = {
  x: (OUTER_TECH.x + OUTER_ACC.x + OUTER_PASS.x) / 3,
  y: (OUTER_TECH.y + OUTER_ACC.y + OUTER_PASS.y) / 3,
}

const MAX_STARS = 14
const MAX_TECH_EFFICIENCY = 0.5

interface SkillPP {
  techPP: number
  accPP: number
  passPP: number
  totalPP: number
}

interface TimelineEntry {
  label: string
  timestamp: number
  skillPP: SkillPP
  scoreCount: number
}

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})


function computeSkillPP(scores: {
  stars: number;
  accuracy: number;
  pp: number
}[]): SkillPP | null {
  const ranked = scores.filter(s => s.stars > 0 && s.pp > 0 && s.accuracy > 0)
  if (ranked.length === 0) {
    return null
  }

  const sorted = ranked.toSorted((a, b) => b.pp - a.pp)
  const topN = sorted.slice(0, 100)

  let techPP = 0
  let accPP = 0
  let passPP = 0
  let totalPP = 0

  for (let i = 0; i < topN.length; i++) {
    const score = topN[i]
    const weight = Math.pow(0.965, i)
    const weightedPP = score.pp * weight

    const rawPass = Math.min(score.stars / MAX_STARS, 1)
    const rawAcc = score.accuracy / 100
    const rawTech = Math.min(score.pp / (score.stars * score.accuracy) / MAX_TECH_EFFICIENCY, 1)

    const rawTotal = rawPass + rawAcc + rawTech
    if (rawTotal === 0) {
      continue
    }

    techPP += weightedPP * (rawTech / rawTotal)
    accPP += weightedPP * (rawAcc / rawTotal)
    passPP += weightedPP * (rawPass / rawTotal)
    totalPP += weightedPP
  }

  return {
    techPP,
    accPP,
    passPP,
    totalPP,
  }
}

function buildTimeline(scores: {
  stars: number
  accuracy: number
  pp: number
  timestamp: Date
}[]): TimelineEntry[] {
  if (scores.length === 0) {
    return []
  }

  const ranked = scores.filter(s => s.stars > 0 && s.pp > 0 && s.accuracy > 0)
  if (ranked.length === 0) {
    return []
  }

  const sorted = ranked.toSorted((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const firstDate = new Date(sorted[0].timestamp)
  const lastDate = new Date(sorted[sorted.length - 1].timestamp)

  const entries: TimelineEntry[] = []
  const current = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1))
  const endMonth = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth() + 1, 0))

  while (current <= endMonth) {
    const monthEnd = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0))
    const cumulativeScores = sorted.filter(s => new Date(s.timestamp).getTime() <= monthEnd.getTime())
    const skillPP = computeSkillPP(cumulativeScores)

    if (skillPP) {
      entries.push({
        label: monthFormatter.format(current),
        timestamp: monthEnd.getTime(),
        skillPP,
        scoreCount: cumulativeScores.filter(s => s.stars > 0 && s.pp > 0).length,
      })
    }

    current.setUTCMonth(current.getUTCMonth() + 1)
  }

  return entries
}

function lerp(a: number, b: number, t: number) {
  return a + (t * (b - a))
}

function computeInnerCorners(techPct: number, accPct: number, passPct: number) {
  const t = Math.min(techPct, 1)
  const a = Math.min(accPct, 1)
  const p = Math.min(passPct, 1)

  return {
    tech: {
      x: lerp(CENTER.x, OUTER_TECH.x, t),
      y: lerp(CENTER.y, OUTER_TECH.y, t),
    },
    acc: {
      x: lerp(CENTER.x, OUTER_ACC.x, a),
      y: lerp(CENTER.y, OUTER_ACC.y, a),
    },
    pass: {
      x: lerp(CENTER.x, OUTER_PASS.x, p),
      y: lerp(CENTER.y, OUTER_PASS.y, p),
    },
  }
}

function TriangleSVG({ techPct, accPct, passPct }: {
  techPct: number;
  accPct: number;
  passPct: number
}) {
  const { tech, acc, pass } = computeInnerCorners(techPct, accPct, passPct)

  const outerPath = `M ${OUTER_TECH.x},${OUTER_TECH.y} L ${OUTER_ACC.x},${OUTER_ACC.y} ${OUTER_PASS.x},${OUTER_PASS.y} Z`
  const innerPath = `M ${tech.x},${tech.y} L ${acc.x},${acc.y} ${pass.x},${pass.y} Z`
  const clipId = 'skillInnerClip'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${VW} ${VH}`}
      className="max-h-[280px] max-w-[280px]"
    >
      <defs>
        <radialGradient
          id="gTech"
          gradientUnits="userSpaceOnUse"
          cx={OUTER_TECH.x}
          cy={OUTER_TECH.y}
          r={VW}
        >
          <stop offset="0%" stopColor={`rgba(255, 60, 60, ${0.6 + (techPct * 0.4)})`} />
          <stop offset="60%" stopColor="rgba(255, 60, 60, 0)" />
        </radialGradient>
        <radialGradient
          id="gAcc"
          gradientUnits="userSpaceOnUse"
          cx={OUTER_ACC.x}
          cy={OUTER_ACC.y}
          r={VW}
        >
          <stop offset="0%" stopColor={`rgba(60, 120, 255, ${0.6 + (accPct * 0.4)})`} />
          <stop offset="60%" stopColor="rgba(60, 120, 255, 0)" />
        </radialGradient>
        <radialGradient
          id="gPass"
          gradientUnits="userSpaceOnUse"
          cx={OUTER_PASS.x}
          cy={OUTER_PASS.y}
          r={VW}
        >
          <stop offset="0%" stopColor={`rgba(60, 210, 60, ${0.6 + (passPct * 0.4)})`} />
          <stop offset="60%" stopColor="rgba(60, 210, 60, 0)" />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={innerPath} />
        </clipPath>
      </defs>

      <line
        x1={CENTER.x} y1={CENTER.y}
        x2={OUTER_TECH.x} y2={OUTER_TECH.y}
        stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"
      />
      <line
        x1={CENTER.x} y1={CENTER.y}
        x2={OUTER_ACC.x} y2={OUTER_ACC.y}
        stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"
      />
      <line
        x1={CENTER.x} y1={CENTER.y}
        x2={OUTER_PASS.x} y2={OUTER_PASS.y}
        stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"
      />

      <path
        d={outerPath}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeDasharray="4 2"
      />

      <g clipPath={`url(#${clipId})`}>
        <path d={innerPath} fill="rgba(255,255,255,0.06)" />
        <path d={innerPath} fill="url(#gTech)" />
        <path d={innerPath} fill="url(#gAcc)" />
        <path d={innerPath} fill="url(#gPass)" />
      </g>

      <path
        d={innerPath}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SkillBar({ techPct, accPct, passPct }: {
  techPct: number;
  accPct: number;
  passPct: number
}) {
  return (
    <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full">
      <div
        className="h-full bg-red-400 transition-all duration-500"
        style={{ width: `${techPct * 100}%` }}
      />
      <div
        className="h-full bg-blue-400 transition-all duration-500"
        style={{ width: `${accPct * 100}%` }}
      />
      <div
        className="h-full bg-green-400 transition-all duration-500"
        style={{ width: `${passPct * 100}%` }}
      />
    </div>
  )
}

function TimelineSlider({
  timeline,
  selectedIndex,
  onSelect,
}: {
  timeline: TimelineEntry[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (timeline.length <= 1) {
    return null
  }

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-3 md:max-w-[250px] md:gap-2">
      <Slider
        value={[ selectedIndex ]}
        onValueChange={v => onSelect(v[0])}
        min={0}
        max={timeline.length - 1}
        step={1}
        labelPosition="none"
        className="w-full"
      />
      <div className="scrollbar-none max-h-[min(42vh,220px)] overflow-y-auto overscroll-contain md:max-h-[280px]">
        <div className="flex flex-col gap-0.5">
          {[ ...timeline ].reverse().map((entry, reverseIdx) => {
            const idx = timeline.length - 1 - reverseIdx
            const isSelected = idx === selectedIndex
            const {
              totalPP, techPP, accPP, passPP,
            } = entry.skillPP
            const techPct = totalPP > 0 ? techPP / totalPP : 0
            const accPct = totalPP > 0 ? accPP / totalPP : 0
            const passPct = totalPP > 0 ? passPP / totalPP : 0

            return (
              <button
                type="button"
                key={entry.timestamp}
                onClick={() => onSelect(idx)}
                className={`cursor-pointer touch-manipulation rounded-md px-3 py-2 text-left text-sm transition-colors md:px-2 md:py-1 md:text-xs ${
                  isSelected
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {idx === timeline.length - 1 ? 'Today' : entry.label}
                <SkillBar techPct={techPct} accPct={accPct} passPct={passPct} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function SkillTriangleChart({ player }: { player: ScoreSaberPlayer }) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: [
      'skill-triangle',
      player.id,
    ],
    queryFn: async () => {
      const response = await ssrApi.getPlayerScoresChart(player.id)
      return response?.data || []
    },
  })

  const timeline = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return []
    }
    return buildTimeline(chartData)
  }, [ chartData ])

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState<number | null>(null)

  const activeIndex = selectedIndex ?? (timeline.length > 0 ? timeline.length - 1 : 0)
  const activeEntry = timeline[activeIndex]
  const skillPP = activeEntry?.skillPP ?? null

  const techPct = skillPP && skillPP.totalPP > 0 ? skillPP.techPP / skillPP.totalPP : 0
  const accPct = skillPP && skillPP.totalPP > 0 ? skillPP.accPP / skillPP.totalPP : 0
  const passPct = skillPP && skillPP.totalPP > 0 ? skillPP.passPP / skillPP.totalPP : 0

  if (isLoading) {
    return (
      <div className="flex min-h-[min(70vh,400px)] items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-muted-foreground text-sm">Computing skill triangle...</p>
        </div>
      </div>
    )
  }

  if (!skillPP) {
    return (
      <div className="flex min-h-[min(50vh,400px)] items-center justify-center px-4 py-8">
        <p className="text-muted-foreground text-center text-sm">
          Not enough ranked score data for skill triangle
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 overflow-visible px-3 pt-3
                      pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-6 md:p-6 md:pb-6">
      <div className="flex w-full max-w-lg flex-col-reverse items-stretch gap-6 overflow-visible
                        md:max-w-none md:flex-row md:items-center md:justify-center md:gap-10">
        {timeline.length > 1 && (
          <TimelineSlider
            timeline={timeline}
            selectedIndex={activeIndex}
            onSelect={setSelectedIndex}
          />
        )}

        <div className="relative mx-auto w-full max-w-[min(100%,340px)] overflow-visible pt-12 pb-12">
          <div className="absolute top-0 left-0 flex flex-col items-start">
            <SimpleTooltip
              display={<p>PP from high-efficiency plays — extracting more PP per unit of difficulty</p>}
              side="top"
              showOnMobile
            >
              <div className="flex flex-col items-start gap-0">
                <span className="text-xs font-semibold text-red-400 sm:text-sm">
                  Tech: {formatPp(skillPP.techPP)}pp
                </span>
                <span className="text-[10px] text-yellow-400 sm:text-xs">({(techPct * 100).toFixed(2)}%)</span>
              </div>
            </SimpleTooltip>
          </div>

          <div className="absolute top-0 right-0 flex flex-col items-end">
            <SimpleTooltip
              display={<p>PP from high-accuracy plays — scoring closer to the maximum on each map</p>}
              side="top"
              showOnMobile
            >
              <div className="flex flex-col items-end gap-0">
                <span className="text-xs font-semibold text-blue-400 sm:text-sm">
                  Acc: {formatPp(skillPP.accPP)}pp
                </span>
                <span className="text-[10px] text-yellow-400 sm:text-xs">({(accPct * 100).toFixed(2)}%)</span>
              </div>
            </SimpleTooltip>
          </div>

          <div className="mx-auto aspect-square w-full max-w-[220px] transition-all duration-500 sm:max-w-[240px] md:h-[280px] md:w-[280px] md:max-w-[280px]">
            <TriangleSVG techPct={techPct} accPct={accPct} passPct={passPct} />
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <SimpleTooltip
              display={<p>PP from passing harder, higher star-rated maps</p>}
              side="bottom"
              showOnMobile
            >
              <div className="flex flex-col items-center gap-0">
                <span className="text-xs font-semibold text-green-400 sm:text-sm">
                  Pass: {formatPp(skillPP.passPP)}pp
                </span>
                <span className="text-[10px] text-yellow-400 sm:text-xs">({(passPct * 100).toFixed(2)}%)</span>
              </div>
            </SimpleTooltip>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground mt-2 w-full text-center text-xs md:mt-4">
        Based on top {Math.min(100, activeEntry?.scoreCount ?? 0)} ranked scores
        {activeIndex !== timeline.length - 1 && activeEntry ? ` as of ${activeEntry.label}` : ''}
      </div>
    </div>
  )
}
