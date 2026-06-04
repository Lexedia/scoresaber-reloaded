import { env } from '@ssr/common/env'
import { formatNumberWithCommas } from '@ssr/common/utils/number-utils'
import { getDifficultyName } from '@ssr/common/utils/song-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { ImageResponse } from 'takumi-js/response'

export const runtime = 'edge'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const response = await ssrApi.fetchLeaderboard(parseInt(id, 10), 'basic')

    if (!response || !response.leaderboard) {
      return new Response('Leaderboard not found', { status: 404 })
    }

    const leaderboard = response.leaderboard
    const diffName = getDifficultyName(leaderboard.difficulty.difficulty)

    const getDiffColor = (diff: string) => {
      switch (diff.toLowerCase()) {
        case 'easy': return '#3cb371'
        case 'normal': return '#59b0f4'
        case 'hard': return '#ff6347'
        case 'expert': return '#bf2a42'
        case 'expertplus': return '#8f48db'
        default: return '#fff'
      }
    }

    const color = getDiffColor(leaderboard.difficulty.difficulty)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            backgroundColor: '#1a1717',
            backgroundImage: 'linear-gradient(to bottom right, #1a1717, #2d3748, #1a202c)',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              background: 'rgba(26, 23, 23, 0.8)',
              padding: '50px',
              borderRadius: '40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: `2px solid ${color}40`,
              width: '100%',
            }}
          >
            <img
              src={leaderboard.songArt}
              alt={leaderboard.songName}
              style={{
                width: 250,
                height: 250,
                borderRadius: '20px',
                border: `4px solid ${color}`,
                marginRight: '60px',
                boxShadow: `0 0 30px ${color}60`,
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            }}>
              <h1
                style={{
                  fontSize: 70,
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '600px',
                }}
              >
                {leaderboard.songName}
              </h1>
              <h2
                style={{
                  fontSize: 40,
                  fontWeight: 500,
                  color: '#a0aec0',
                  margin: '10px 0 20px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {leaderboard.songAuthorName}
              </h2>

              <div style={{
                display: 'flex',
                gap: '20px',
                marginTop: '10px',
              }}>
                <div
                  style={{
                    background: color,
                    padding: '10px 20px',
                    borderRadius: '15px',
                    fontSize: 35,
                    fontWeight: 700,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {diffName}
                </div>
                {leaderboard.stars > 0 && (
                  <div
                    style={{
                      background: '#5c6bff',
                      padding: '10px 20px',
                      borderRadius: '15px',
                      fontSize: 35,
                      fontWeight: 700,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {leaderboard.stars}★
                  </div>
                )}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '10px 20px',
                    borderRadius: '15px',
                    fontSize: 35,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {formatNumberWithCommas(leaderboard.plays)} Plays
                </div>
              </div>
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '50px',
            fontSize: 35,
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 600,
          }}>
            {env.NEXT_PUBLIC_WEBSITE_NAME}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (error) {
    console.error('Failed to generate OG image for leaderboard:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
