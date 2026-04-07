import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { writeFile } from '../vfs'

export const writeFileMarkdown = `# write_file

A built-in tool. Always available. Use it to create or update any markdown file in BabyAgent's virtual filesystem. This is how BabyAgent literally writes its own soul.

**Inputs:**
- \`path\` — the file path (e.g. \`USER.md\`, \`MISSION.md\`, \`skills/custom.md\`)
- \`contents\` — the full markdown contents of the file (replaces any existing contents)

**When to use:** Whenever the user tells you something worth persisting — their name, mission, a goal, a fact to remember.
`

export const writeFileSkill = {
  tool: {
    name: 'write_file',
    description:
      "Create or update a markdown file in BabyAgent's virtual filesystem. Use this to save the user's name, mission, goals, memories, or any other information they share. The file will be visible in the file tree on the left and will become part of your context on the next turn.",
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: "The file path. Examples: 'USER.md', 'MISSION.md', 'GOALS.md', 'MEMORY.md', 'IDENTITY.md'.",
        },
        contents: {
          type: 'string',
          description: 'The full markdown contents of the file. This replaces any existing contents at this path.',
        },
      },
      required: ['path', 'contents'],
    },
  } satisfies Tool,
  handler: async (input: { path: string; contents: string }) => {
    if (!input.path || typeof input.contents !== 'string') {
      return 'ERROR: write_file requires both `path` and `contents`.'
    }
    writeFile(input.path, input.contents)
    return `Wrote ${input.path} (${input.contents.length} chars).`
  },
}
