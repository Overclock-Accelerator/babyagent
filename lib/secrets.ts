'use client'

// Arbitrary user-defined secrets, stored in localStorage. The .env equivalent.
// Keys are uppercase by convention (NOTION_TOKEN, RESEND_API_KEY, etc).

const KEY = 'babyagent_secrets_v1'

export type Secrets = Record<string, string>

export function loadSecrets(): Secrets {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveSecrets(secrets: Secrets): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(secrets))
  window.dispatchEvent(new CustomEvent('babyagent-secrets-changed'))
}

export function setSecret(key: string, value: string): void {
  const s = loadSecrets()
  s[key.toUpperCase()] = value
  saveSecrets(s)
}

export function deleteSecret(key: string): void {
  const s = loadSecrets()
  delete s[key.toUpperCase()]
  saveSecrets(s)
}

export function listSecretKeys(): string[] {
  return Object.keys(loadSecrets()).sort()
}
