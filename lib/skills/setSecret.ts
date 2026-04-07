import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { setSecret as save } from '../secrets'

export const setSecretMarkdown = `# set_secret

A built-in meta-tool. BabyAgent uses this to store API keys and tokens that custom skills need. Secrets are stored in the user's browser localStorage and are referenced by name (e.g. \`{{secrets.RESEND_API_KEY}}\`) inside custom skill specs.

**Inputs:**
- \`key\` — the secret name (UPPERCASE convention)
- \`value\` — the secret value
`

export const setSecretSkill = {
  tool: {
    name: 'set_secret',
    description:
      "Store an API key, token, or other secret in the user's browser. Use this when a user shares a credential needed by a custom skill (e.g. a Discord webhook URL, a Notion token). The secret can then be referenced inside a custom skill's request URL/headers/body using {{secrets.KEY_NAME}}. Always confirm the key name with the user. Never echo the value back in chat.",
    input_schema: {
      type: 'object' as const,
      properties: {
        key: {
          type: 'string',
          description: 'The secret name. UPPERCASE_SNAKE_CASE convention (e.g. NOTION_TOKEN, DISCORD_WEBHOOK_URL).',
        },
        value: {
          type: 'string',
          description: 'The secret value (the actual API key, token, URL, etc).',
        },
      },
      required: ['key', 'value'],
    },
  } satisfies Tool,
  handler: async (input: { key: string; value: string }) => {
    if (!input.key || !input.value) return 'ERROR: set_secret requires both `key` and `value`.'
    save(input.key, input.value)
    return `Stored secret ${input.key.toUpperCase()}. It is available to skills as {{secrets.${input.key.toUpperCase()}}}.`
  },
}
