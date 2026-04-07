import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'BabyAgent — Raise your own AI agent'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f4f3ef',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: 'absolute',
            inset: 24,
            border: '3px solid #0c0c0c',
            display: 'flex',
          }}
        />

        {/* Egg */}
        <div style={{ fontSize: 160, lineHeight: 1, display: 'flex' }}>
          🐣
        </div>

        {/* Title */}
        <div
          style={{
            marginTop: 32,
            fontSize: 72,
            fontWeight: 700,
            color: '#0c0c0c',
            letterSpacing: '-2px',
            display: 'flex',
          }}
        >
          BabyAgent
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            color: '#e85d04',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          Raise your own AI agent
        </div>

        {/* Footer tag */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 18,
            color: '#888',
            display: 'flex',
            letterSpacing: '0.05em',
          }}
        >
          Built for Overclock Accelerator workshops
        </div>
      </div>
    ),
    { ...size }
  )
}
