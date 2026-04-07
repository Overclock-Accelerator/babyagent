'use client'

import { useEffect, useState } from 'react'

export type Mode = 'local' | 'hosted' | 'unknown'

let cached: { mode: Mode; proxyEnabled: boolean } | null = null
let pending: Promise<{ mode: Mode; proxyEnabled: boolean }> | null = null

export async function fetchMode(): Promise<{ mode: Mode; proxyEnabled: boolean }> {
  if (cached) return cached
  if (pending) return pending
  pending = (async () => {
    try {
      const res = await fetch('/api/mode', { cache: 'no-store' })
      if (!res.ok) throw new Error(`mode fetch ${res.status}`)
      const data = await res.json()
      cached = { mode: data.mode as Mode, proxyEnabled: !!data.proxyEnabled }
      return cached
    } catch {
      cached = { mode: 'hosted', proxyEnabled: false }
      return cached
    } finally {
      pending = null
    }
  })()
  return pending
}

export function getCachedMode(): { mode: Mode; proxyEnabled: boolean } {
  return cached ?? { mode: 'unknown', proxyEnabled: false }
}

export function useMode(): { mode: Mode; proxyEnabled: boolean } {
  const [state, setState] = useState<{ mode: Mode; proxyEnabled: boolean }>(
    () => cached ?? { mode: 'unknown', proxyEnabled: false },
  )
  useEffect(() => {
    let live = true
    fetchMode().then((m) => { if (live) setState(m) })
    return () => { live = false }
  }, [])
  return state
}
