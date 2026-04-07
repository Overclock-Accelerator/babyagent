// Generic executor for user-defined custom skills. Walks the spec's request,
// interpolates {{input.X}} and {{secrets.Y}} templates, runs fetch, returns text.
//
// If the spec has `proxy: true` and the local /api/proxy route is available
// (i.e. running locally, not on Vercel), the request is routed through it.
// This unlocks APIs that block browser-direct requests (Notion, Resend, etc.).

import type { CustomSkillSpec } from '../customSkills'
import { fetchMode } from '../mode'

function interpolate(value: any, input: Record<string, any>, secrets: Record<string, string>): any {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*(input|secrets)\.([A-Za-z0-9_]+)\s*\}\}/g, (_, scope, name) => {
      if (scope === 'input') {
        const v = input[name]
        return v === undefined || v === null ? '' : String(v)
      }
      if (scope === 'secrets') {
        return secrets[name] ?? ''
      }
      return ''
    })
  }
  if (Array.isArray(value)) {
    return value.map(v => interpolate(v, input, secrets))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = interpolate(v, input, secrets)
    }
    return out
  }
  return value
}

export async function runCustomSkill(
  spec: CustomSkillSpec,
  input: Record<string, any>,
  secrets: Record<string, string>,
): Promise<string> {
  const req = spec.request
  const url = interpolate(req.url, input, secrets) as string
  const headers: Record<string, string> = {}
  if (req.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      headers[k] = interpolate(v, input, secrets) as string
    }
  }

  let bodyString: string | undefined
  if (req.body !== undefined && req.method !== 'GET') {
    const interp = interpolate(req.body, input, secrets)
    if (typeof interp === 'string') {
      bodyString = interp
    } else {
      bodyString = JSON.stringify(interp)
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json'
      }
    }
  }

  // Decide direct vs proxy
  let useProxy = false
  if (spec.proxy) {
    const { proxyEnabled } = await fetchMode()
    if (!proxyEnabled) {
      return `ERROR: This skill needs the local proxy (because the target API blocks browser requests), but BabyAgent is currently running in hosted mode. Tell the user: to use this skill, clone the repo from https://github.com/Overclock-Accelerator/babyagent and run \`bun dev\` locally. The same skill will then work because their laptop becomes the server.`
    }
    useProxy = true
  }

  try {
    let res: Response
    if (useProxy) {
      res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: req.method,
          url,
          headers,
          body: bodyString,
        }),
      })
    } else {
      res = await fetch(url, { method: req.method, headers, body: bodyString })
    }
    const text = await res.text()
    const truncated = text.length > 4000 ? text.slice(0, 4000) + '\n\n…[truncated]' : text
    if (!res.ok) {
      return `HTTP ${res.status} ${res.statusText}\n\n${truncated}`
    }
    return truncated || `OK (${res.status}, empty body)`
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!useProxy && (message.toLowerCase().includes('cors') || message.toLowerCase().includes('failed to fetch'))) {
      return `ERROR: ${message}\n\nThis is most likely a CORS issue — the target API blocks browser-direct requests. Two fixes: (1) re-create this skill with proxy: true and run BabyAgent locally (bun dev), or (2) use a webhook-friendly alternative like Discord webhooks, Slack incoming webhooks, ntfy.sh, or webhook.site.`
    }
    return `ERROR: ${message}`
  }
}
