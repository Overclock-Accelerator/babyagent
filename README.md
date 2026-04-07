# 🐣 BabyAgent

> A browser-based agent-building emulator. Raise your own AI agent by filling in markdown files.

Built for the **Overclock Accelerator** workshop on autonomous agents. Inspired by the design philosophies of [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure), [OpenClaw](https://github.com/openclaw/openclaw), and [nanoclaw](https://github.com/qwibitai/nanoclaw).

## What it does

BabyAgent lets you experience what it feels like to bootstrap a personal AI agent — without the install pain. Open the lab, talk to BabyAgent, and watch it write its own scaffolding into a virtual filesystem on the left. Every markdown file you add becomes part of the agent's identity, mission, memory, and capabilities. Add a skill, and the agent gains a real new tool it can call.

The whole point: **scaffolding shapes behavior**. You see the causal link in real time.

### Three panes

- **Left — Filesystem.** A live tree of markdown files (`USER.md`, `MISSION.md`, `GOALS.md`, `MEMORY.md`, `skills/*.md`). Click any file to open it.
- **Middle — Editor.** A real CodeMirror markdown editor. Edit any file directly; changes take effect on BabyAgent's next turn.
- **Right — Chat + Journey.** Talk to BabyAgent. Below the chat, a 7-step journey panel guides you through bringing the agent to life. After step 7, you enter Sandbox Mode and can bolt on more skills.

### The 7-step journey

1. **About You** → `USER.md`
2. **Identity** → `IDENTITY.md`
3. **Mission** → `MISSION.md`
4. **Goals** → `GOALS.md`
5. **Memory** → `MEMORY.md`
6. **Web Fetch skill** → `skills/web_fetch.md`
7. **Perplexity Research skill** → `skills/perplexity_research.md`

BabyAgent itself walks you through it — out of the box, it greets you with: *"I don't know anything yet. Will you help me grow up?"*

### Skills (real, not faked)

| Skill | Tool | Needs key |
|---|---|---|
| `write_file` | Built-in. BabyAgent uses this to author its own scaffolding. | no |
| `web_fetch` | Fetches the readable text of any public URL via [r.jina.ai](https://r.jina.ai). | no |
| `perplexity_research` | Cited research via Perplexity Sonar. | yes — Perplexity |
| `remember` | Appends a fact to `MEMORY.md`. | no |

## Running locally

```bash
git clone https://github.com/Overclock-Accelerator/babyagent.git
cd babyagent
bun install   # or npm install
bun dev       # or npm run dev
```

Open <http://localhost:3000>.

**Workshop password:** `BabyShark101`

You'll need an [Anthropic API key](https://console.anthropic.com/settings/keys) — paste it into Settings (gear icon, top right). Optionally add a [Perplexity key](https://www.perplexity.ai/settings/api) for the research skill.

> **Where do my keys go?** Only into your browser's `localStorage`. There is no backend. Your keys travel directly to api.anthropic.com / api.perplexity.ai and nowhere else.

## Architecture

- **Next.js 15** App Router + React 19 + TypeScript
- **Tailwind CSS v4** with Swiss-poster design tokens (matching `pgpf-support-simulator`)
- **CodeMirror 6** for the markdown editor
- **`@anthropic-ai/sdk`** with `dangerouslyAllowBrowser: true` — no backend needed
- **localStorage** for everything: VFS, chat history, API keys, auth

### How the agent loop works

```
user message
    ↓
read VFS from localStorage
    ↓
assemble system prompt: BASE_INSTRUCTIONS + every file in order
    ↓
register active tools (write_file always on; others if installed)
    ↓
call Anthropic with messages + system + tools
    ↓
loop: if tool_use, run handler, append result, call again
    ↓
display final text + tool call trace
```

The system prompt is rebuilt on every turn. **There is no fancy state machine** — the entire agent is "concatenate the files and call Claude with tools." That simplicity is the lesson.

## Customization

Want to add your own skill? It's three things:

1. Create `lib/skills/myskill.ts` with a `tool` (Anthropic tool definition), a `handler` (async function), and a `markdown` description.
2. Register it in `lib/skills/index.ts` inside `ALL_SKILLS`.
3. Either add it to the journey (`lib/journey.ts`) or let users install it from Sandbox Mode.

The whole codebase is small enough to read in 30 minutes. That's intentional — it's a reference implementation, not a framework.

## License

MIT © Overclock Accelerator
