import ScoreButton from "@/components/score/button/score-button";
import { env } from "@ssr/common/env";
import { BeatSaverMap } from "@ssr/common/schemas/beatsaver/map/map";
import { ScoreSaberLeaderboard } from "@ssr/common/schemas/scoresaber/leaderboard/leaderboard";
import { PlayCircleIcon } from "lucide-react";

type MapPreviewButtonProps = {
  leaderboard: ScoreSaberLeaderboard;
  beatSaverMap: BeatSaverMap;
};

export function MapPreviewButton({ leaderboard, beatSaverMap }: MapPreviewButtonProps) {
  return (
    <ScoreButton
      href={`${env.NEXT_PUBLIC_ARCVIEWER_URL}/?id=${beatSaverMap.bsr}&difficulty=${leaderboard.difficulty.difficulty}&mode=${leaderboard.difficulty.characteristic}`}
      tooltip={<p>Click to view a preview of the map</p>}
    >
      <PlayCircleIcon className="h-5 w-5" />
    </ScoreButton>
  );
}
