import { env } from '@ssr/common/env'
import { ImageResponse } from 'takumi-js/response'

export const runtime = 'edge' // Or standard Node, takumi supports both, let's omit if not needed, but typical Next.js is edge. Satori uses edge usually.

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1717',
          backgroundImage: 'linear-gradient(to bottom right, #1a1717, #5c6bff, #0070f3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26, 23, 23, 0.8)',
            padding: '80px',
            borderRadius: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <h1
            style={{
              fontSize: 100,
              fontWeight: 800,
              color: 'white',
              margin: 0,
              letterSpacing: '-0.05em',
              textAlign: 'center',
            }}
          >
            {env.NEXT_PUBLIC_WEBSITE_NAME}
          </h1>
          <p
            style={{
              fontSize: 40,
              color: '#e2e8f0',
              marginTop: '20px',
              textAlign: 'center',
              fontWeight: 300,
            }}
          >
            A new way to view your scores
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
