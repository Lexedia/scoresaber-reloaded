import { env } from "@ssr/common/env";
import { formatNumberWithCommas, formatPp } from "@ssr/common/utils/number-utils";
import { getDifficultyName, getScoreBadgeFromAccuracy } from "@ssr/common/utils/song-utils";
import { ssrApi } from "@ssr/common/utils/ssr-api";
import { ImageResponse } from "takumi-js/response";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await ssrApi.getScore(id);

    if (!response || !response.score) {
      return new Response("Score not found", { status: 404 });
    }

    const { score, leaderboard } = response;
    const player = score.playerInfo;
    const songName = leaderboard.songName;
    const songArt = leaderboard.songArt;
    
    // const diffColor = getDifficulty(leaderboard.difficulty.difficulty).color.replace("var(--", "").replace(")", "");
    const diffName = getDifficultyName(leaderboard.difficulty.difficulty);

    const getDiffColor = (diff: string) => {
      switch (diff.toLowerCase()) {
        case "easy": return "#3cb371";
        case "normal": return "#59b0f4";
        case "hard": return "#ff6347";
        case "expert": return "#bf2a42";
        case "expertplus": return "#8f48db";
        default: return "#fff";
      }
    };

    const color = getDiffColor(leaderboard.difficulty.difficulty);
    const accBadge = getScoreBadgeFromAccuracy(score.accuracy);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px",
            backgroundColor: "#1a1717",
            backgroundImage: "linear-gradient(to bottom right, #1a1717, #2d3748, #000000)",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          {/* Top section: Player Info */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {player?.avatar && (
              <img
                src={player.avatar}
                alt={player.name || "Player"}
                style={{ width: 80, height: 80, borderRadius: "50%", border: "4px solid #5c6bff", marginRight: "20px" }}
              />
            )}
            <h2 style={{ fontSize: 45, fontWeight: 700, margin: 0, color: "#e2e8f0" }}>
              {player?.name || "Unknown Player"}
            </h2>
          </div>

          {/* Middle section: Map Info & Score */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "40px",
              borderRadius: "30px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
              border: `2px solid ${color}40`,
              marginTop: "40px",
              marginBottom: "40px",
            }}
          >
            <img
              src={songArt}
              alt={songName}
              style={{
                width: 200,
                height: 200,
                borderRadius: "20px",
                border: `4px solid ${color}`,
                marginRight: "40px",
                boxShadow: `0 0 25px ${color}50`,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <h1
                style={{
                  fontSize: 55,
                  fontWeight: 800,
                  margin: "0 0 10px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {songName}
              </h1>
              
              <div style={{ display: "flex", gap: "15px", marginBottom: "25px", alignItems: "center" }}>
                <div style={{ background: color, padding: "8px 16px", borderRadius: "12px", fontSize: 28, fontWeight: 700 }}>
                  {diffName}
                </div>
                {leaderboard.stars > 0 && (
                  <div style={{ background: "#5c6bff", padding: "8px 16px", borderRadius: "12px", fontSize: 28, fontWeight: 700 }}>
                    {leaderboard.stars}★
                  </div>
                )}
                <div style={{ background: accBadge.color, padding: "8px 16px", borderRadius: "12px", fontSize: 28, fontWeight: 700, color: accBadge.textColor || "white" }}>
                  {accBadge.name}
                </div>
              </div>

              {/* Score Stats */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 24, color: "#a0aec0", fontWeight: 600 }}>Accuracy</span>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>{score.accuracy.toFixed(2)}%</span>
                </div>
                {score.pp > 0 && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 24, color: "#a0aec0", fontWeight: 600 }}>PP</span>
                    <span style={{ fontSize: 40, fontWeight: 800, color: "#0070f3" }}>{formatPp(score.pp)}</span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 24, color: "#a0aec0", fontWeight: 600 }}>Rank</span>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>#{formatNumberWithCommas(score.rank)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 30, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              {score.fullCombo ? "Full Combo" : `${score.misses} Misses`} • {formatNumberWithCommas(score.score)} Score
            </div>
            <div style={{ fontSize: 30, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              {env.NEXT_PUBLIC_WEBSITE_NAME}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Failed to generate OG image for score:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
