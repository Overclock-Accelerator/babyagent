import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { addCustomSkill, specToMarkdown, type CustomSkillSpec } from '../customSkills'
import { writeFile } from '../vfs'

export const createSkillMarkdown = `# create_skill

A built-in meta-tool. BabyAgent uses this to define brand-new skills on the fly during a conversation with the user.

**Inputs:**
- \`id\` — snake_case identifier (e.g. \`send_discord_message\`)
- \`name\` — human-readable name
- \`description\` — when to use this skill (this becomes the tool description Claude reads)
- \`inputs\` — array of input field definitions
- \`request\` — the HTTP request to execute, with \`{{input.X}}\` and \`{{secrets.Y}}\` templates
`

export const createSkillSkill = {
  tool: {
    name: 'create_skill',
    description:
      "Define a brand-new skill on the fly. Use this when the user wants to give BabyAgent a new capability that requires calling an external HTTP API. Walk the user through the steps in chat first: ask what service they want to use, ask for any API keys (use set_secret to store them), ask what inputs the skill should take, then call this tool with the full spec. The skill becomes available on the very next turn.",
    input_schema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: "snake_case identifier, e.g. 'send_discord_message'. Must be unique and a valid tool name.",
        },
        name: {
          type: 'string',
          description: 'Human-readable name, e.g. "Send Discord Message"',
        },
        description: {
          type: 'string',
          description: 'When to use this skill. Becomes the tool description that Claude reads on future turns.',
        },
        inputs: {
          type: 'array',
          description: 'The arguments this skill takes from the caller (BabyAgent itself, on later turns).',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Argument name' },
              type: { type: 'string', enum: ['string', 'number', 'boolean'] },
              description: { type: 'string' },
              required: { type: 'boolean' },
            },
            required: ['name', 'type', 'description'],
          },
        },
        request: {
          type: 'object',
          description:
            'The HTTP request to execute. URL, headers (values), and body (string or object values) may contain templates of the form {{input.NAME}} for arguments or {{secrets.NAME}} for stored secrets.',
          properties: {
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
            url: { type: 'string' },
            headers: { type: 'object', additionalProperties: { type: 'string' } },
            body: { description: 'Request body — either a JSON object or a string. Omit for GET requests.' },
          },
          required: ['method', 'url'],
        },
        proxy: {
          type: 'boolean',
          description:
            'Set to true if the target API blocks browser-direct requests (Notion, Resend, SendGrid, Linear, Slack Web API, Twilio, most enterprise SaaS). The skill will route through the local /api/proxy route, which only works when BabyAgent is running locally (not on Vercel). For browser-friendly APIs (GitHub public, Discord webhooks, ntfy.sh, Tavily, OpenWeather, etc.) leave this false or omit it.',
        },
      },
      required: ['id', 'name', 'description', 'inputs', 'request'],
    },
  } satisfies Tool,
  handler: async (input: any) => {
    if (!input.id || !input.name || !input.description) {
      return 'ERROR: create_skill requires id, name, description, inputs, and request.'
    }
    if (!/^[a-z][a-z0-9_]*$/.test(input.id)) {
      return `ERROR: id must be snake_case (lowercase letters, digits, underscores; must start with a letter). Got: ${input.id}`
    }
    if (!input.request || !input.request.method || !input.request.url) {
      return 'ERROR: request.method and request.url are required.'
    }

    const spec: CustomSkillSpec = {
      id: input.id,
      name: input.name,
      description: input.description,
      inputs: Array.isArray(input.inputs) ? input.inputs : [],
      request: input.request,
      proxy: input.proxy === true,
      createdAt: new Date().toISOString(),
    }
    addCustomSkill(spec)
    // Also drop a markdown file in the VFS so it shows up in the tree
    writeFile(`skills/${spec.id}.md`, specToMarkdown(spec))

    return `Created skill "${spec.name}" (id: ${spec.id}). It will be available on your next turn — you can call it immediately. The skill is also visible in the file tree at skills/${spec.id}.md and in the Custom Skills list in Settings.`
  },
}
