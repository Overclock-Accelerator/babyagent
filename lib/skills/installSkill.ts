import type { Tool } from '@anthropic-ai/sdk/resources/messages'

// Note: the handler for install_skill is defined inline in skills/index.ts
// because it needs access to BUILTIN_SKILLS, which would cause a circular
// import if pulled in here.

export const installSkillMarkdown = `# install_skill

A built-in meta-tool. Lets BabyAgent install a bundled optional skill on the fly from chat. The skill becomes available on the very next turn.

**Inputs:**
- \`id\` — the id of a bundled skill (e.g. \`web_fetch\`, \`perplexity_research\`, \`remember\`)

**When to use:** When the user asks for a capability that an existing bundled skill provides — e.g. "let me know what's on Hacker News right now" → install \`web_fetch\` first if it isn't installed yet.
`

export const installSkillTool: Tool = {
  name: 'install_skill',
  description:
    "Install one of the bundled optional skills (web_fetch, perplexity_research, remember) so BabyAgent can call it on the next turn. Use this when the user asks for a capability that a bundled skill already provides — don't make them click an install button. Only valid for bundled skill ids; for brand-new capabilities not in the bundle, use create_skill instead.",
  input_schema: {
    type: 'object' as const,
    properties: {
      id: {
        type: 'string',
        description: "The id of a bundled skill. Currently valid: 'web_fetch', 'perplexity_research', 'remember'.",
      },
    },
    required: ['id'],
  },
}
