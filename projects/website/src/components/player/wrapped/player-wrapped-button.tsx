'use client'

import { cn } from '@/common/utils'
import SimpleTooltip from '@/components/simple-tooltip'
import { Spinner } from '@/components/spinner'
import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { useQuery } from '@tanstack/react-query'
import { CalendarDaysIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { PlayerWrappedSlides } from './player-wrapped-slides'

type PlayerWrappedButtonProps = {
  playerId: string
}

export default function PlayerWrappedButton({ playerId }: PlayerWrappedButtonProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const [ selectedYear, setSelectedYear ] = useState(currentYear)
  const [ open, setOpen ] = useState(false)
  const [ showSlides, setShowSlides ] = useState(false)

  const database = useDatabase()
  const developerMode = useStableLiveQuery(() => database.getDeveloperMode())

  const { data, isLoading } = useQuery({
    queryKey: [ 'player-wrapped', playerId, selectedYear ],
    queryFn: () => ssrApi.getPlayerWrapped(playerId, selectedYear),
    enabled: open,
  })

  const years = Array.from({ length: currentYear - 2021 }, (_, i) => currentYear - i)

  if (currentMonth !== 11 && !developerMode) {
    return null
  }

  return (
    <>
      <SimpleTooltip display={<p>View {currentYear} Wrapped</p>}>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-linear-to-r from-violet-600/20 to-pink-600/20',
            'px-2.5 py-1.5 text-xs font-semibold text-violet-300 transition-all duration-200',
            'hover:border-violet-400/60 hover:from-violet-600/30 hover:to-pink-600/30 hover:text-violet-200',
          )}
        >
          <SparklesIcon className="size-3.5" />
          Wrapped
        </button>
      </SimpleTooltip>

      {open && !showSlides && (
        <div
          className="fixed inset-0 z-9998 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget)
            setOpen(false) }}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-linear-to-b from-[#0e0a1a] to-[#130f20] p-8 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-pink-500">
                <SparklesIcon className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Wrapped</h2>
                <p className="text-xs text-white/40">Select a year to explore</p>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <CalendarDaysIcon className="size-4 text-white/40" />
              <div className="flex gap-1.5">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                      selectedYear === y
                        ? 'bg-linear-to-r from-violet-500 to-pink-500 text-white'
                        : 'text-white/40 hover:text-white/70',
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            )}

            {!isLoading && data && (
              <button
                onClick={() => setShowSlides(true)}
                className="w-full rounded-xl bg-linear-to-r from-violet-500 to-pink-500 py-3 text-sm font-bold
                text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
              >
                Start {selectedYear} Wrapped ✨
              </button>
            )}

            {!isLoading && !data && (
              <p className="text-center text-sm text-white/40">No data available for {selectedYear}</p>
            )}
          </div>
        </div>
      )}

      {showSlides && data && (
        <PlayerWrappedSlides
          data={data}
          year={selectedYear}
          onClose={() => { setShowSlides(false); setOpen(false) }}
        />
      )}
    </>
  )
}
