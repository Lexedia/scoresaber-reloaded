import { env } from '@ssr/common/env'
import { formatNumberWithCommas, formatPp } from '@ssr/common/utils/number-utils'
import { ssrApi } from '@ssr/common/utils/ssr-api'
import { ImageResponse } from 'takumi-js/response'

export const runtime = 'edge'

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
            justifyContent: 'center',
            padding: '80px',
            backgroundColor: '#1a1717',
            backgroundImage: 'linear-gradient(to bottom right, #1a1717, #5c6bff, #0070f3)',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              background: 'rgba(26, 23, 23, 0.85)',
              padding: '60px',
              borderRadius: '40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
            }}
          >
            <img
              src={player.avatar}
              alt={player.name}
              style={{
                width: 250,
                height: 250,
                borderRadius: '50%',
                border: '8px solid #5c6bff',
                marginRight: '60px',
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
              }}>
                <img
                  src={`${env.NEXT_PUBLIC_WEBSITE_URL}/flags/${player.country.toLowerCase()}.png`}
                  alt={player.country}
                  style={{
                    width: '60px',
                    height: '40px',
                    borderRadius: '8px',
                    marginRight: '20px',
                  }}
                />
                <h1
                  style={{
                    fontSize: 80,
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '-0.05em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '600px',
                  }}
                >
                  {player.name}
                </h1>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 45,
                  fontWeight: 600,
                }}>
                  <span style={{
                    color: '#e2e8f0',
                    marginRight: '15px',
                    width: '180px',
                  }}>Global:</span>
                  <span style={{ color: '#5c6bff' }}>#{formatNumberWithCommas(player.rank)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 45,
                  fontWeight: 600,
                }}>
                  <span style={{
                    color: '#e2e8f0',
                    marginRight: '15px',
                    width: '180px',
                  }}>Country:</span>
                  <span style={{ color: '#5c6bff' }}>#{formatNumberWithCommas(player.countryRank)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 45,
                  fontWeight: 600,
                }}>
                  <span style={{
                    color: '#e2e8f0',
                    marginRight: '15px',
                    width: '180px',
                  }}>PP:</span>
                  <span style={{ color: '#0070f3' }}>{formatPp(player.pp)}pp</span>
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
    console.error('Failed to generate OG image for player:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
