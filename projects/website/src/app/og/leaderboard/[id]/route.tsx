import { env } from '@ssr/common/env'
import { formatNumberWithCommas } from '@ssr/common/utils/number-utils'
import { getDifficultyName } from '@ssr/common/utils/song-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { promises as fs } from 'fs'
import path from 'path'
import { ImageResponse } from 'takumi-js/response'

const jetbrainsMono = await fs.readFile(path.join(process.cwd(), 'src/app/fonts/JetBrainsMono.ttf'))

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

    const StarIcon = () => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    )

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0d0d0f',
            color: 'white',
            fontFamily: '"Jetbrains Mono", monospace',
            padding: '48px',
            gap: '28px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: '2px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '-0.01em',
            }}>
              Leaderboard Info
            </span>
            <div style={{
              flex: 1,
              display: 'flex',
            }} />
            <span style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 500,
            }}>
              {env.NEXT_PUBLIC_WEBSITE_NAME}
            </span>
          </div>

          <div style={{
            display: 'flex',
            flex: 1,
            gap: '40px',
            alignItems: 'stretch',
            marginTop: '20px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
            }}>
              <img
                src={leaderboard.songArt}
                alt={leaderboard.songName}
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: '18px',
                  border: `3px solid ${color}`,
                  boxShadow: `0 0 40px ${color}55, 0 0 80px ${color}22`,
                }}
              />
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}>
                <div style={{
                  background: color,
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}>
                  {diffName}
                </div>
                {leaderboard.stars > 0 && (
                  <div style={{
                    background: 'rgba(92,107,255,0.2)',
                    border: '1px solid rgba(92,107,255,0.5)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#a5b4fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    {leaderboard.stars}
                    <StarIcon />
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              overflow: 'hidden',
              gap: '30px',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#f0f0ff',
                }}>
                  {leaderboard.songName}
                </div>
                {leaderboard.songSubName && (
                  <div style={{
                    fontSize: 26,
                    color: 'rgba(255,255,255,0.45)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {leaderboard.songSubName}
                  </div>
                )}
                <div style={{
                  fontSize: 22,
                  color: 'rgba(255,255,255,0.3)',
                  fontWeight: 400,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {leaderboard.songAuthorName} · Mapped by {leaderboard.levelAuthorName}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '14px',
              }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '24px 20px',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>Total Plays</span>
                  <span style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: '#e2e8f0',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {formatNumberWithCommas(leaderboard.plays)}
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: leaderboard.ranked ? 'rgba(92,107,255,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${leaderboard.ranked ? 'rgba(92,107,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  padding: '24px 20px',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: 16,
                    color: leaderboard.ranked ? 'rgba(165,180,252,0.8)' : 'rgba(255,255,255,0.4)',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>Status</span>
                  <span style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: leaderboard.ranked ? '#a5b4fc' : '#e2e8f0',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {leaderboard.ranked ? 'Ranked' : 'Unranked'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Jetbrains Mono',
            data: jetbrainsMono,
            style: 'normal',
          },
        ],
      },
    )
  } catch (error) {
    console.error('Failed to generate OG image for leaderboard:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

