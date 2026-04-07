import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const perplexityMarkdown = `# perplexity_research

Runs a real research query against Perplexity's Sonar API. Returns a cited, up-to-date answer.

**Inputs:**
- \`query\` — the research question

**Requires:** A Perplexity API key, set in Settings (gear icon, top right). Never leaves the browser.

**When to use:** When the user asks about something current, factual, or that needs sources.
`

export const perplexitySkill = {
  tool: {
    name: 'perplexity_research',
    description:
      "Run a research query via Perplexity Sonar. Returns a cited answer. Use this when the user asks about current events, facts, or anything that benefits from web sources. Requires the user's Perplexity API key.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The research question, in natural language.',
        },
      },
      required: ['query'],
    },
  } satisfies Tool,
  handler: async (input: { query: string }, ctx: { perplexityKey?: string }) => {
    if (!input.query) return 'ERROR: perplexity_research requires a `query`.'
    if (!ctx.perplexityKey)
      return 'ERROR: No Perplexity API key configured. Tell the user to add one in Settings (gear icon, top right).'
    try {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.perplexityKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: input.query }],
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        return `ERROR: Perplexity returned ${res.status}: ${errText.slice(0, 300)}`
      }
      const data = await res.json()
      const answer = data.choices?.[0]?.message?.content ?? '(empty response)'
      const citations = (data.citations ?? []).slice(0, 5)
      const citationText = citations.length ? `\n\nSources:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}` : ''
      return answer + citationText
    } catch (err) {
      return `ERROR calling Perplexity: ${err instanceof Error ? err.message : String(err)}`
    }
  },
}
