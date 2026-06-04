import BeatSaverLogo from '@/components/logos/logos/beatsaver-logo'
import ScoreButton from '@/components/score/button/score-button'
import SimpleLink from '@/components/simple-link'
import { env } from '@ssr/common/env'
import { BeatSaverMap } from '@ssr/common/schemas/beatsaver/map/map'

type BeatSaverMapProps = {
  beatSaverMap: BeatSaverMap;
}

export function BeatSaverMapButton({ beatSaverMap }: BeatSaverMapProps) {
  const url = `https://${env.NEXT_PUBLIC_BEATSAVER_DOMAIN}/maps/${beatSaverMap.bsr}`

  return (
    <SimpleLink href={url} target="_blank">
      <ScoreButton tooltip={<p>Click to open the map</p>}>
        <BeatSaverLogo />
      </ScoreButton>
    </SimpleLink>
  )
}
