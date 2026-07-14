'use client'

import SimpleTooltip from '@/components/simple-tooltip'
import StatValue from '@/components/statistic/stat-value'
import { ScoreSaberPlayerStatistics } from '@ssr/common/schemas/scoresaber/player/statistics'
import { formatNumberWithCommas } from '@ssr/common/utils/number-utils'
import { getAccDetails, getScoreBadgeFromName } from '@ssr/common/utils/song-utils'
import { parseAsString, useQueryState } from 'nuqs'

const badges: Partial<Record<keyof ScoreSaberPlayerStatistics, string>> = {
  aPlays: 'A',
  sPlays: 'S',
  spPlays: 'S+',
  ssPlays: 'SS',
  sspPlays: 'SS+',
  godPlays: 'GOD',
}

export default function PlayerAccBadges({ statistics }: { statistics: ScoreSaberPlayerStatistics }) {
  const [ , setAccBadgeFilter ] = useQueryState('accBadge', parseAsString)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {Object.entries(badges).map(([
        name,
        displayName,
      ]) => {
        const badge = getScoreBadgeFromName(displayName.replace('Plus', '+'))

        return (
          <SimpleTooltip
            display={
              <div>
                <p>{getAccDetails(badge)}</p>
                <p className="italic">On Ranked Maps</p>
              </div>
            }
            key={name}
            showOnMobile
          >
            <button
              key={name}
              onClick={() => {
                setAccBadgeFilter(badge.name)
              }}
              className="transition-transform hover:scale-105 hover:cursor-pointer"
            >
              <StatValue
                name={badge.name}
                color={badge.color}
                value={formatNumberWithCommas(statistics[name as keyof ScoreSaberPlayerStatistics] ?? 0)}
                className="h-full"
                size="lg"
              />
            </button>
          </SimpleTooltip>
        )
      })}
    </div>
  )
}
