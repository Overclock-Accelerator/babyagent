'use client'

import type { Tool } from '@anthropic-ai/sdk/resources/messages'

// User-defined skills, persisted in localStorage. Each skill is a JSON spec
// that describes its inputs and a parameterized HTTP request to execute.

const KEY = 'babyagent_custom_skills_v1'

export type CustomSkillInput = {
  name: string
  type: 'string' | 'number' | 'boolean'
  description: string
  required?: boolean
}

export type CustomSkillRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string // may contain {{input.X}} and {{secrets.Y}}
  headers?: Record<string, string> // values may contain templates
  body?: any // string or object; values may contain templates
}

export type CustomSkillSpec = {
  id: string // snake_case
  name: string
  description: string
  inputs: CustomSkillInput[]
  request: CustomSkillRequest
  /**
   * If true, route the request through the local /api/proxy route. Use this for
   * APIs that block browser-direct requests (Notion, Resend, Linear, Slack Web API).
   * The proxy is only available when BabyAgent runs locally (bun dev), NOT on
   * Vercel deployments. When proxy is required but unavailable, the skill fails
   * with a clear message telling the user to run locally.
   */
  proxy?: boolean
  createdAt: string
}

export function loadCustomSkills(): CustomSkillSpec[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomSkills(specs: CustomSkillSpec[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(specs))
  window.dispatchEvent(new CustomEvent('babyagent-custom-skills-changed'))
}

export function addCustomSkill(spec: CustomSkillSpec): void {
  const all = loadCustomSkills()
  // replace if same id
  const next = all.filter(s => s.id !== spec.id)
  next.push(spec)
  saveCustomSkills(next)
}

export function deleteCustomSkill(id: string): void {
  saveCustomSkills(loadCustomSkills().filter(s => s.id !== id))
}

// Convert a custom skill spec to an Anthropic Tool definition.
export function specToTool(spec: CustomSkillSpec): Tool {
  const properties: Record<string, any> = {}
  const required: string[] = []
  for (const input of spec.inputs) {
    properties[input.name] = {
      type: input.type,
      description: input.description,
    }
    if (input.required) required.push(input.name)
  }
  return {
    name: spec.id,
    description: spec.description,
    input_schema: {
      type: 'object',
      properties,
      required,
    },
  }
}

export function specToMarkdown(spec: CustomSkillSpec): string {
  const inputLines = spec.inputs
    .map(i => `- \`${i.name}\` (${i.type}${i.required ? ', required' : ''}) — ${i.description}`)
    .join('\n')
  const proxyLine = spec.proxy
    ? '\n**Proxy required:** Yes — runs through the local proxy route. Only works when BabyAgent is running locally (`bun dev`), not on the hosted deployment.\n'
    : ''
  return `# ${spec.id}

${spec.description}

**Inputs:**
${inputLines || '(none)'}

**Request:** \`${spec.request.method}\` \`${spec.request.url}\`
${proxyLine}
_Created via chat on ${spec.createdAt.slice(0, 10)}._
`
}
