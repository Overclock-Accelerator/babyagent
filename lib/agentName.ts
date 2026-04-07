'use client'

import { useEffect, useState } from 'react'
import { loadVFS } from './vfs'

export const DEFAULT_NAME = 'BabyAgent'

// Extract the agent's chosen name from IDENTITY.md. Tries a few common formats:
// 1. A line like "Name: X" or "**Name:** X"
// 2. A line like "I am X" or "My name is X"
// 3. The first H1 heading
// Falls back to DEFAULT_NAME.
export function extractAgentName(identityMd: string | undefined): string {
  if (!identityMd) return DEFAULT_NAME
  const text = identityMd.trim()
  if (!text) return DEFAULT_NAME

  const patterns: RegExp[] = [
    /^\s*\*?\*?Name\*?\*?\s*:\s*["'`]?([^\n"'`]+?)["'`]?\s*$/im,
    /^\s*-\s*\*?\*?Name\*?\*?\s*:\s*["'`]?([^\n"'`]+?)["'`]?\s*$/im,
    /\bMy name is\s+["'`]?([A-Z][\w\- ]{0,30}?)["'`.,!]?(?:\s|$)/i,
    /\bI am\s+["'`]?([A-Z][\w\- ]{0,30}?)["'`.,!]?(?:\s|$)/i,
    /^#\s+(.+?)\s*$/m,
  ]

  for (const re of patterns) {
    const m = text.match(re)
    if (m && m[1]) {
      const cleaned = m[1].trim().replace(/[*_`]/g, '').slice(0, 32)
      if (cleaned && cleaned.toLowerCase() !== 'identity') return cleaned
    }
  }
  return DEFAULT_NAME
}

export function getAgentName(): string {
  return extractAgentName(loadVFS()['IDENTITY.md'])
}

export function useAgentName(): string {
  const [name, setName] = useState<string>(DEFAULT_NAME)
  useEffect(() => {
    const refresh = () => setName(getAgentName())
    refresh()
    window.addEventListener('babyagent-vfs-changed', refresh)
    return () => window.removeEventListener('babyagent-vfs-changed', refresh)
  }, [])
  return name
}
