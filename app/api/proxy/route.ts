import { NextResponse } from 'next/server'

// Generic HTTP proxy. Available ONLY when the app is run locally (not on Vercel).
// Custom skills can route through here when their target API blocks browser-direct
// requests (Notion, Resend, Linear, Slack Web API, etc).
//
// Security model:
// - Disabled entirely on Vercel deployments (VERCEL env var present).
// - Accepts only POST with a structured body.
// - Forwards the request as-is and returns the response status + body.
// - Does NOT persist or log secret values.
//
// This is intentionally simple — it's a workshop tool meant to run on localhost,
// not a production API gateway.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ProxyRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers?: Record<string, string>
  body?: string
}

export async function POST(req: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          'Proxy disabled in hosted mode. Run BabyAgent locally to use this skill (clone the repo and run `bun dev`).',
      },
      { status: 403 },
    )
  }

  let parsed: ProxyRequest
  try {
    parsed = (await req.json()) as ProxyRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!parsed.url || !parsed.method) {
    return NextResponse.json({ error: 'Missing url or method' }, { status: 400 })
  }
  if (!/^https?:\/\//i.test(parsed.url)) {
    return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 })
  }

  try {
    const res = await fetch(parsed.url, {
      method: parsed.method,
      headers: parsed.headers ?? {},
      body: parsed.method === 'GET' ? undefined : parsed.body,
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'text/plain',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Proxy fetch failed: ${message}` }, { status: 502 })
  }
}
