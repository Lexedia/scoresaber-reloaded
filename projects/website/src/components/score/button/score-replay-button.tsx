'use client'

import ArcViewerLogo from '@/components/logos/logos/arcviewer-logo'
import ScoreButton from '@/components/score/button/score-button'
import useDatabase from '@/hooks/use-database'
import { useStableLiveQuery } from '@/hooks/use-stable-live-query'
import { ReplayViewerTypes } from '@ssr/common/replay-viewer'
import { BeatLeaderScore } from '@ssr/common/schemas/beatleader/score/score'
import { getBeatLeaderReplayRedirectUrl } from '@ssr/common/utils/beatleader-utils'
import BeatSaberPepeLogo from '../../logos/logos/beatsaber-pepe-logo'
import ScoresaberLogo from '../../logos/logos/scoresaber-logo'

type ScoreReplayButtonProps = {
  score: BeatLeaderScore | undefined;
  size?: number;
}

const logos: Record<
  ReplayViewerTypes,
  React.FC<{
    size?: number,
    className?: string
  }>
> = {
  arcviewer: ArcViewerLogo,
  beatleader: BeatSaberPepeLogo,
  chroviewer: ScoresaberLogo,
}

export function ScoreReplayButton({ score, size = 28 }: ScoreReplayButtonProps) {
  const database = useDatabase()
  const viewer = useStableLiveQuery(async () => database.getReplayViewer())

  if (!viewer || !score) {
    return null
  }

  const Logo = logos[viewer.id]

  return (
    <ScoreButton
      href={viewer.generateUrl(score.scoreId, getBeatLeaderReplayRedirectUrl(score))}
      tooltip={<p>Click to view the score replay!</p>}
      size={size}
    >
      <Logo size={size} />
    </ScoreButton>
  )
}
