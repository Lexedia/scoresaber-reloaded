'use client'

import ArcViewerLogo from '@/components/logos/logos/arcviewer-logo'
import ScoreButton from '@/components/score/button/score-button'
import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import { BeatLeaderScore } from '@ssr/common/schemas/beatleader/score/score'
import { getBeatLeaderReplayRedirectUrl } from '@ssr/common/utils/beatleader-utils'
import BeatSaberPepeLogo from '../../logos/logos/beatsaber-pepe-logo'

type ScoreReplayButtonProps = {
  score: BeatLeaderScore | undefined;
  size?: number;
}

export function ScoreReplayButton({ score, size = 28 }: ScoreReplayButtonProps) {
  const database = useDatabase()
  const viewer = useStableLiveQuery(async () => database.getReplayViewer())

  if (!viewer || !score) {
    return null
  }

  return (
    <ScoreButton
      href={viewer.generateUrl(score.scoreId, getBeatLeaderReplayRedirectUrl(score))}
      tooltip={<p>Click to view the score replay!</p>}
      size={size}
    >
      {viewer.id === 'arcviewer' ? <ArcViewerLogo size={size} /> : <BeatSaberPepeLogo size={size} />}
    </ScoreButton>
  )
}
