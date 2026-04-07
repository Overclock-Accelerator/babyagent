'use client'

import Anthropic from '@anthropic-ai/sdk'
import type { Message, MessageParam, Tool, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages'
import { getActiveTools, getSkill, type SkillContext } from './skills'
import { assembleSystemPrompt, getInstalledSkillIds } from './prompt'
import { loadVFS } from './vfs'
import { loadSecrets } from './secrets'

const ANTHROPIC_KEY_STORAGE = 'babyagent_anthropic_key'
const PERPLEXITY_KEY_STORAGE = 'babyagent_perplexity_key'
const MODEL_STORAGE = 'babyagent_model'

export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'

export function getAnthropicKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ANTHROPIC_KEY_STORAGE) ?? ''
}
export function setAnthropicKey(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ANTHROPIC_KEY_STORAGE, key)
}

export function getPerplexityKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(PERPLEXITY_KEY_STORAGE) ?? ''
}
export function setPerplexityKey(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PERPLEXITY_KEY_STORAGE, key)
}

export function getModel(): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL
  return localStorage.getItem(MODEL_STORAGE) ?? DEFAULT_MODEL
}
export function setModel(model: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MODEL_STORAGE, model)
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: { name: string; input: any; output: string }[]
}

function newId() {
  return Math.random().toString(36).slice(2, 11)
}

// Run a single conversation turn with full tool-use loop. Returns the final assistant text + any tool calls invoked.
export async function runTurn(
  history: ChatMessage[],
  userInput: string,
  options: { onProgress?: (note: string) => void } = {},
): Promise<ChatMessage> {
  const apiKey = getAnthropicKey()
  if (!apiKey) {
    return {
      id: newId(),
      role: 'assistant',
      content: "I need an Anthropic API key before I can think. Click the gear icon (top right) to add one. It stays in your browser — it never goes anywhere except api.anthropic.com.",
    }
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const model = getModel()
  const vfs = loadVFS()
  const installed = getInstalledSkillIds(vfs)
  const tools: Tool[] = getActiveTools(installed)
  const systemPrompt = assembleSystemPrompt(vfs)

  const skillCtx: SkillContext = {
    perplexityKey: getPerplexityKey(),
    secrets: loadSecrets(),
  }

  // Convert chat history to Anthropic messages
  const messages: MessageParam[] = history.map(m => ({
    role: m.role,
    content: m.content,
  }))
  messages.push({ role: 'user', content: userInput })

  const toolCallsCollected: { name: string; input: any; output: string }[] = []
  let finalText = ''
  const MAX_ITERATIONS = 8

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const response: Message = await client.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      tools: tools.length ? tools : undefined,
      messages,
    })

    // Collect text blocks
    const textBlocks = response.content.filter(b => b.type === 'text').map(b => (b as any).text as string)
    if (textBlocks.length) finalText = textBlocks.join('\n\n')

    if (response.stop_reason !== 'tool_use') {
      break
    }

    // Handle tool uses
    const toolUses = response.content.filter(b => b.type === 'tool_use') as ToolUseBlock[]
    if (toolUses.length === 0) break

    // Add assistant turn (with tool_use blocks) to messages
    messages.push({ role: 'assistant', content: response.content })

    const toolResults: any[] = []
    for (const tu of toolUses) {
      const skill = getSkill(tu.name)
      let output: string
      if (!skill) {
        output = `ERROR: unknown tool ${tu.name}`
      } else {
        options.onProgress?.(`calling ${tu.name}…`)
        try {
          output = await skill.handler(tu.input as any, skillCtx)
        } catch (err) {
          output = `ERROR running ${tu.name}: ${err instanceof Error ? err.message : String(err)}`
        }
      }
      toolCallsCollected.push({ name: tu.name, input: tu.input, output })
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: output,
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  return {
    id: newId(),
    role: 'assistant',
    content: finalText || '(no response)',
    toolCalls: toolCallsCollected.length ? toolCallsCollected : undefined,
  }
}
