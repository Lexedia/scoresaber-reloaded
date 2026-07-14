'use client'

import { cn } from '@/common/utils'
import { Input } from '@/components/ui/input'
import { ScoreSaberCurve } from '@ssr/common/leaderboard-curve/scoresaber-curve'
import { ScoreSaberLeaderboard } from '@ssr/common/schemas/scoresaber/leaderboard/leaderboard'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Plus, Search, Star, Trash2, Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../ui/button'

interface PlayerPpSimulatorProps {
  playerId: string
  playerPp?: number
}

interface SimulationEntry {
  id: string
  leaderboardId?: number
  stars?: number
  accuracy: number
  rawPp: number
  songName?: string
  difficulty?: string
  coverImage?: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-500',
  Normal: 'bg-sky-500',
  Hard: 'bg-orange-400',
  Expert: 'bg-red-500',
  ExpertPlus: 'bg-purple-500',
}

function DifficultyPill({ difficulty }: { difficulty?: string }) {
  const color = DIFFICULTY_COLORS[difficulty ?? ''] ?? 'bg-gray-500'
  const label = difficulty === 'ExpertPlus' ? 'E+' : difficulty?.slice(0, 1) ?? '?'
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white', color)}>
      {label}
    </span>
  )
}

function AccuracySlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const whole = Math.floor(clamped)
  const decimal = parseFloat((clamped - whole).toFixed(2))

  const sliderClass = cn(
    'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white',
    '[&::-webkit-slider-thumb]:size-3.5',
    '[&::-webkit-slider-thumb]:rounded-full',
    '[&::-webkit-slider-thumb]:appearance-none',
    '[&::-webkit-slider-thumb]:bg-white',
  )

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="w-4 shrink-0 text-[10px] text-white/30">%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={whole}
          onChange={e => onChange(parseInt(e.target.value) + decimal)}
          className={sliderClass}
        />
        <span className="w-12 text-right font-mono text-xs text-white/70">{whole}%</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-4 shrink-0 text-[10px] text-white/30">.xx</span>
        <input
          type="range"
          min={0}
          max={0.99}
          step={0.01}
          value={decimal}
          onChange={e => onChange(whole + parseFloat(parseFloat(e.target.value).toFixed(2)))}
          className={sliderClass}
        />
        <span className="w-12 text-right font-mono text-xs text-white/70">+{decimal.toFixed(2)}%</span>
      </div>
      <p className="text-right font-mono text-sm font-semibold text-white">{clamped.toFixed(2)}%</p>
    </div>
  )
}

function ResultPanel({ result }: {
  result: {
    weightedPpGain: number;
    currentTotalPp: number;
    newTotalPp: number
  } | undefined
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
      {result ? (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">Estimated PP Gain</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums text-green-400">
              +{result.weightedPpGain.toFixed(2)}
              <span className="ml-1 text-lg font-semibold text-white/60">pp</span>
            </p>
          </div>

          <div className="divide-y divide-white/5 rounded-lg border border-white/10 bg-white/1.5">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-white/50">Current PP</span>
              <span className="font-mono text-sm font-semibold">{result.currentTotalPp.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-white/50">Gain</span>
              <span className="font-mono text-sm font-semibold text-green-400">+{result.weightedPpGain.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm font-medium text-white/80">New Total</span>
              <span className="font-mono text-base font-bold text-green-400">{result.newTotalPp.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Zap className="size-8 text-white/20" />
          <p className="text-sm text-white/40">Add scores and simulate to see your potential PP gain.</p>
        </div>
      )}
    </div>
  )
}

export function PlayerPpSimulator({ playerId, playerPp }: PlayerPpSimulatorProps) {
  const [ entries, setEntries ] = useState<SimulationEntry[]>([])
  const [ searchInputValue, setSearchInputValue ] = useState('')
  const [ searchQuery, setSearchQuery ] = useState('')
  const [ isSearchOpen, setIsSearchOpen ] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInputValue), 400)
    return () => clearTimeout(timer)
  }, [ searchInputValue ])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: searchResults } = useQuery({
    queryKey: [ 'searchLeaderboards', searchQuery ],
    queryFn: () => ssrApi.searchLeaderboards(1, {
      query: searchQuery,
      ranked: true,
    }),
    enabled: searchQuery.length > 2,
  })

  const { data: simulationResult, mutate: runSimulation, isPending } = useMutation({
    mutationFn: (rawPps: number[]) => ssrApi.simulatePpGain(playerId, rawPps, playerPp),
  })

  const addEntry = (leaderboard?: ScoreSaberLeaderboard) => {
    setEntries(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        leaderboardId: leaderboard?.id,
        stars: leaderboard?.difficulty?.stars,
        accuracy: 95,
        rawPp: leaderboard?.difficulty?.stars ? ScoreSaberCurve.getPp(leaderboard.difficulty.stars, 95) : 0,
        songName: leaderboard?.songName,
        difficulty: leaderboard?.difficulty?.difficulty,
        coverImage: leaderboard?.songArt,
      },
    ])
    setSearchInputValue('')
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))

  const updateAccuracy = (id: string, accuracy: number) => {
    setEntries(prev => prev.map(e => e.id !== id ? e : {
      ...e,
      accuracy,
      rawPp: e.stars ? ScoreSaberCurve.getPp(e.stars, accuracy) : e.rawPp,
    }))
  }

  const updateRawPp = (id: string, rawPp: number) => {
    setEntries(prev => prev.map(e => e.id !== id ? e : {
      ...e,
      rawPp,
    }))
  }

  const simulate = () => {
    const pps = entries.map(e => e.rawPp).filter(pp => pp > 0)
    if (pps.length > 0) {
      runSimulation(pps)
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
              <Input
                className="pl-9"
                placeholder="Search ranked maps…"
                value={searchInputValue}
                onChange={e => {
                  setSearchInputValue(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
            </div>
            {isSearchOpen && searchResults?.items && searchResults.items.length > 0 && searchQuery.length > 2 && (
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.items.map(lb => (
                    <button
                      key={lb.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                      onClick={() => addEntry(lb)}
                    >
                      <img src={lb.songArt} className="size-10 shrink-0 rounded-md object-cover" alt="" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{lb.songName}</p>
                        <p className="truncate text-xs text-white/40">{lb.songAuthorName}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <DifficultyPill difficulty={lb.difficulty.difficulty} />
                        <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                          <Star className="size-3 fill-yellow-400" />
                          {lb.difficulty.stars?.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Entries */}
          <div className="space-y-2">
            {entries.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-white/30">
                No scores added yet. Search for a map or add a custom score.
              </div>
            )}
            {entries.map(entry => (
              <div
                key={entry.id}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3"
              >
                {entry.coverImage && (
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
                    style={{ backgroundImage: `url(${entry.coverImage})` }}
                  />
                )}
                <div className="relative flex items-center gap-3">
                  {entry.coverImage && (
                    <img src={entry.coverImage} className="size-10 shrink-0 rounded-md object-cover" alt="" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {entry.songName ?? 'Custom Score'}
                      </p>
                      {entry.difficulty && <DifficultyPill difficulty={entry.difficulty} />}
                      {entry.stars && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                          <Star className="size-3 fill-yellow-400" />
                          {entry.stars.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {entry.stars !== undefined ? (
                      <AccuracySlider value={entry.accuracy} onChange={v => updateAccuracy(entry.id, v)} />
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-white/40">Raw PP:</span>
                        <input
                          type="number"
                          value={entry.rawPp}
                          onChange={e => updateRawPp(entry.id, parseFloat(e.target.value) || 0)}
                          className="w-24 rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-sm font-bold text-white/90">{entry.rawPp.toFixed(1)} pp</span>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-white/30 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => addEntry()}>
              <Plus className="size-4" />
              Add Custom
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={simulate}
              disabled={entries.length === 0 || isPending}
            >
              <Zap className="size-4" />
              {isPending ? 'Simulating…' : 'Simulate'}
            </Button>
          </div>
        </div>

        {/* Right: Results */}
        <ResultPanel result={simulationResult} />
      </div>
    </div>
  )
}
