import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { readFile, writeFile } from '../vfs'

export const rememberMarkdown = `# remember

Appends a fact to MEMORY.md. Use this when the user shares something worth remembering across conversations.

**Inputs:**
- \`fact\` — a short statement to remember (one sentence)
`

export const rememberSkill = {
  tool: {
    name: 'remember',
    description:
      'Append a single fact to MEMORY.md. Use this whenever the user shares something worth remembering — a preference, a name, a context cue.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fact: {
          type: 'string',
          description: 'A short statement (one sentence) to remember.',
        },
      },
      required: ['fact'],
    },
  } satisfies Tool,
  handler: async (input: { fact: string }) => {
    if (!input.fact) return 'ERROR: remember requires a `fact`.'
    const existing = readFile('MEMORY.md') ?? '# Memory\n\n'
    const date = new Date().toISOString().slice(0, 10)
    const updated = existing.trimEnd() + `\n- (${date}) ${input.fact}\n`
    writeFile('MEMORY.md', updated)
    return `Remembered: ${input.fact}`
  },
}
