import StatValue from '@/components/statistic/stat-value'
import { Tooltip } from '@/components/ui/tooltip'
import { CubeIcon } from '@heroicons/react/24/solid'
import { BeatSaverMap } from '@ssr/common/schemas/beatsaver/map/map'
import { formatNumberWithCommas } from '@ssr/common/utils/number-utils'
import { formatTime } from '@ssr/common/utils/time-utils'
import {
  BombIcon, BrickWallIcon, DrumIcon, GaugeIcon, MusicIcon, TimerIcon,
} from 'lucide-react'

type MapAndScoreData = {
  /**
   * The map that the score was set on.
   */
  beatSaver: BeatSaverMap;
}

export function MapStats({ beatSaver }: MapAndScoreData) {
  const metadata = beatSaver.metadata

  return (
    <div className="flex flex-col gap-2">
      {beatSaver.difficulty && (
        <div className="flex flex-wrap justify-center gap-2">
          <StatValue
            name="Length"
            icon={<TimerIcon className="h-4 w-4" />}
            value={formatTime(metadata.duration)}
          />
          <Tooltip content="Beats Per Minute: The tempo of the song.">
            <StatValue
              name="BPM"
              icon={<MusicIcon className="h-4 w-4" />}
              value={formatNumberWithCommas(metadata.bpm)}
            />
          </Tooltip>
          <Tooltip content="Notes Per Second: The average number of notes to hit per second.">
            <StatValue
              name="NPS"
              icon={<DrumIcon className="h-4 w-4" />}
              value={beatSaver.difficulty.nps.toFixed(2)}
            />
          </Tooltip>
          <Tooltip content="Note Jump Speed: The speed at which the notes approach the player.">
            <StatValue
              name="NJS"
              icon={<GaugeIcon className="h-4 w-4" />}
              value={beatSaver.difficulty.njs.toFixed(2)}
            />
          </Tooltip>
          <StatValue
            name="Notes"
            icon={<CubeIcon className="h-4 w-4" />}
            value={formatNumberWithCommas(beatSaver.difficulty.notes)}
          />
          <StatValue
            name="Bombs"
            icon={<BombIcon className="h-4 w-4" />}
            value={formatNumberWithCommas(beatSaver.difficulty.bombs)}
          />
          <StatValue
            name="Obstacles"
            icon={<BrickWallIcon className="h-4 w-4" />}
            value={formatNumberWithCommas(beatSaver.difficulty.obstacles)}
          />
        </div>
      )}
    </div>
  )
}
