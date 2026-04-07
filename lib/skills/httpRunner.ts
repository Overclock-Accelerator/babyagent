// Generic executor for user-defined custom skills. Walks the spec's request,
// interpolates {{input.X}} and {{secrets.Y}} templates, runs fetch, returns text.

import type { CustomSkillSpec } from '../customSkills'

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

  let body: BodyInit | undefined
  if (req.body !== undefined && req.method !== 'GET') {
    const interp = interpolate(req.body, input, secrets)
    if (typeof interp === 'string') {
      body = interp
    } else {
      body = JSON.stringify(interp)
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json'
      }
    }
  }

  try {
    const res = await fetch(url, { method: req.method, headers, body })
    const text = await res.text()
    const truncated = text.length > 4000 ? text.slice(0, 4000) + '\n\n…[truncated]' : text
    if (!res.ok) {
      return `HTTP ${res.status} ${res.statusText}\n\n${truncated}`
    }
    return truncated || `OK (${res.status}, empty body)`
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.toLowerCase().includes('cors') || message.toLowerCase().includes('failed to fetch')) {
      return `ERROR: ${message}\n\nThis is most likely a CORS issue. Many APIs block browser-direct requests. For workshop demos, use webhook-friendly services like Discord webhooks, Slack incoming webhooks, ntfy.sh, or webhook.site — those allow requests directly from the browser.`
    }
    return `ERROR: ${message}`
  }
}
