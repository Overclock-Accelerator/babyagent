import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const webFetchMarkdown = `# web_fetch

Fetches the raw text content of a public URL. No API key required.

**Inputs:**
- \`url\` — the full URL to fetch (must include https://)

**Returns:** The text body of the page (HTML stripped to text where possible), truncated to 8000 chars.

**When to use:** When the user asks you to read a specific page, blog post, or article.
`

async function fetchUrl(url: string): Promise<string> {
  // Use a CORS-friendly text fetcher. r.jina.ai returns clean readable text from any URL.
  const target = `https://r.jina.ai/${url}`
  const res = await fetch(target, { headers: { Accept: 'text/plain' } })
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  const text = await res.text()
  return text.length > 8000 ? text.slice(0, 8000) + '\n\n…[truncated]' : text
}

export const webFetchSkill = {
  tool: {
    name: 'web_fetch',
    description:
      'Fetch the text content of a public URL. Returns clean readable text. Use this when the user asks you to read or summarize a specific page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to fetch, including https://',
        },
      },
      required: ['url'],
    },
  } satisfies Tool,
  handler: async (input: { url: string }) => {
    if (!input.url) return 'ERROR: web_fetch requires a `url`.'
    try {
      const text = await fetchUrl(input.url)
      return text
    } catch (err) {
      return `ERROR fetching ${input.url}: ${err instanceof Error ? err.message : String(err)}`
    }
  },
}
