'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlayerScoreEntry } from '@ssr/common/score/player-score'
import { formatNumberWithCommas, formatPp } from '@ssr/common/utils/number-utils'
import { formatDate } from '@ssr/common/utils/time-utils'
import { History, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

type ScoreVersionSwitcherProps = {
  scoreId: number;
  entries: PlayerScoreEntry[];
}

export default function ScoreVersionSwitcher({ scoreId, entries }: ScoreVersionSwitcherProps) {
  const router = useRouter()

  const handleValueChange = useCallback(
    (value: string) => {
      router.push(`/score/${value}`)
    },
    [ router ],
  )

  if (entries.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <History className="text-muted-foreground size-4 shrink-0" />
      <Select value={scoreId.toString()} onValueChange={handleValueChange}>
        <SelectTrigger className="h-8 w-auto min-w-[200px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {entries.map(entry => (
            <SelectItem key={entry.scoreId} value={entry.scoreId.toString()} className="text-xs">
              <div className="flex items-center gap-2">
                {entry.isCurrent && <Star className="size-3 text-amber-500" />}
                <span className="tabular-nums">{formatNumberWithCommas(entry.score)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {entry.accuracy.toFixed(2)}%
                </span>
                {entry.pp > 0 && (
                  <span className="text-muted-foreground tabular-nums">
                    {formatPp(entry.pp)}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {formatDate(entry.timestamp, 'DD/MM/YYYY, HH:mm:ss')}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
