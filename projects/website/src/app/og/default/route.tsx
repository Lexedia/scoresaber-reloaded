import { env } from '@ssr/common/env'
import { promises as fs } from 'fs'
import path from 'path'
import { ImageResponse } from 'takumi-js/response'

const jetbrainsMono = await fs.readFile(path.join(process.cwd(), 'src/app/fonts/JetBrainsMono.ttf'))

// Honestly maybe just transforming that into a static image would be better idk
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
          backgroundColor: '#0d0d0f',
          color: 'white',
          fontFamily: '"Jetbrains Mono", monospace',
          padding: '80px',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '30px',
          padding: '80px 100px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}>
          <h1 style={{
            fontSize: 90,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(to right, #f0f0ff, #a5b4fc)',
            backgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
            lineHeight: 1.1,
          }}>
            {env.NEXT_PUBLIC_WEBSITE_NAME}
          </h1>

          <div style={{
            width: '80px',
            height: '4px',
            background: 'linear-gradient(to right, #5c6bff, transparent)',
            marginTop: '30px',
            marginBottom: '30px',
            borderRadius: '2px',
          }} />

          <p style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            textAlign: 'center',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            A new way to view your scores
          </p>
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
}
