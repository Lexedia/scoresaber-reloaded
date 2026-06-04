import { env } from '@ssr/common/env'
import { formatNumberWithCommas, formatPp } from '@ssr/common/utils/number-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { promises as fs } from 'fs'
import path from 'path'
import { ImageResponse } from 'takumi-js/response'

const jetbrainsMono = await fs.readFile(path.join(process.cwd(), 'src/app/fonts/JetBrainsMono.ttf'))

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const player = await ssrApi.getScoreSaberPlayer(id, 'basic')

    if (!player) {
      return new Response('Player not found', { status: 404 })
    }

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
          {/* Header */}
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
              Player Profile
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
                src={player.avatar}
                alt={player.name}
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: '18px',
                  border: '3px solid #5c6bff',
                  boxShadow: '0 0 40px rgba(92,107,255,0.35), 0 0 80px rgba(92,107,255,0.15)',
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '10px',
              }}>
                <img
                  src={`${env.NEXT_PUBLIC_WEBSITE_URL}/assets/flags/${player.country.toLowerCase()}.png`}
                  alt={player.country}
                  style={{
                    width: '45px',
                    height: '30px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    objectFit: 'contain',
                  }}
                />
                <span style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {player.country}
                </span>
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
              <h1 style={{
                fontSize: 64,
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-0.03em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#f0f0ff',
                lineHeight: 1.1,
              }}>
                {player.name}
              </h1>

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
                  }}>Global Rank</span>
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
                    #{formatNumberWithCommas(player.rank)}
                  </span>
                </div>

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
                  }}>Country Rank</span>
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
                    #{formatNumberWithCommas(player.countryRank)}
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(92,107,255,0.1)',
                  border: '1px solid rgba(92,107,255,0.3)',
                  borderRadius: '14px',
                  padding: '24px 20px',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: 16,
                    color: 'rgba(165,180,252,0.8)',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>Performance</span>
                  <span style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: '#a5b4fc',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {formatPp(player.pp)}
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
    console.error('Failed to generate OG image for player:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

