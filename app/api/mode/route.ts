import { NextResponse } from 'next/server'

// Tells the client whether the local proxy route is available.
// On Vercel deployments, the VERCEL env var is set — we deliberately disable
// the proxy in hosted mode so the workshop story stays honest:
// "hosted = browser-only, local = your laptop is the server."

export const dynamic = 'force-dynamic'

export function GET() {
  const proxyEnabled = !process.env.VERCEL
  return NextResponse.json({
    proxyEnabled,
    mode: proxyEnabled ? 'local' : 'hosted',
  })
}
