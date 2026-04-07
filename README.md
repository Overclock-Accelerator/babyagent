# 🐣 BabyAgent

> A browser-based agent-building emulator. Raise your own AI agent by talking to it.

Built for the **[Overclock Accelerator](https://overclockaccelerator.com)** workshop on autonomous agents. Inspired by the design philosophies of [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure), [OpenClaw](https://github.com/openclaw/openclaw), and [nanoclaw](https://github.com/qwibitai/nanoclaw).

---

## What this is

BabyAgent is a hands-on lesson disguised as a toy. It lets you experience what it actually feels like to bootstrap a personal AI agent — without the install pain of a real PAI/OpenClaw setup. You open the lab, you talk to BabyAgent, and you watch it write its own scaffolding into a virtual filesystem on the left side of your screen. Every markdown file you (or BabyAgent) author becomes part of the agent's identity, mission, memory, or capabilities. Add a skill, and the agent gains a real, callable tool it didn't have ten seconds ago.

The point of the exercise is to feel the causal link in real time: **scaffolding shapes behavior**. There is no magic. Agents are tools, plus a model, plus a system prompt assembled from markdown files. BabyAgent makes that loop visible and interactive.

---

## What you'll see

The lab is a three-pane workspace:

**Left — `Filesystem`**
A live tree of markdown files. Out of the box you'll see two folders:
- `system/` — descriptions of the four built-in tools BabyAgent always has
- `code/` — the actual TypeScript source for every built-in skill, plus the engine files (agent loop, system prompt assembler, generic HTTP runner). Read these and you understand how every agent works under the hood.

As you progress, more files appear: `USER.md`, `IDENTITY.md`, `MISSION.md`, `GOALS.md`, `MEMORY.md`, and `skills/<id>.md` for each capability you install or invent.

**Middle — `Editor`**
A real CodeMirror editor with markdown and TypeScript syntax highlighting. Click any file in the tree to open it. You can hand-edit any markdown file directly — your edits become part of BabyAgent's context on its next turn. The `code/` files are read-only documentation — editing them doesn't change BabyAgent's runtime behavior (you'd have to fork the repo for that).

**Right — `Chat with [your agent's name]`**
The conversation. Talk to BabyAgent in plain English. Out of the box it greets you with *"I don't know anything yet — will you help me grow up?"* and walks you through a 7-step journey to bring itself to life.

The top nav has buttons for **Journey** (a popup with the step-by-step path), **Settings** (API keys, secrets, custom skills), **Restart** (wipe everything and start over), and a mode badge showing whether you're running locally (with proxy) or hosted (browser-only).

---

## How to use it

### 1. Get in

Visit the deployed app or run it locally (see below). Enter the workshop password when prompted, then paste your [Anthropic API key](https://console.anthropic.com/settings/keys) into Settings. Optionally add a [Perplexity key](https://www.perplexity.ai/settings/api) if you want the research skill.

> Your keys live only in your browser's `localStorage`. They never touch any server other than the AI provider you're calling.

### 2. Walk the journey

BabyAgent itself drives the first 7 steps from the chat. Just answer its questions:

| Step | What happens | File written |
|---|---|---|
| 1 | Tell BabyAgent who you are | `USER.md` |
| 2 | Pick a name and personality for your agent | `IDENTITY.md` |
| 3 | Define what your agent is for | `MISSION.md` |
| 4 | List concrete things you want help with | `GOALS.md` |
| 5 | Seed facts worth remembering | `MEMORY.md` |
| 6 | Install the `web_fetch` skill | `skills/web_fetch.md` |
| 7 | Install the `perplexity_research` skill | `skills/perplexity_research.md` |

Each answer gets written into a markdown file by BabyAgent itself, using its built-in `write_file` tool. You'll see the file appear in the tree on the left. As you fill in identity and mission, the UI starts using your chosen agent name everywhere.

### 3. Sandbox mode — invent your own skills

After step 7, you're in free play. The most pedagogically powerful thing you can do here is **ask BabyAgent to give itself a new capability by describing what you want**. Examples:

> "Give yourself the ability to send me a notification on my phone."

BabyAgent will suggest [ntfy.sh](https://ntfy.sh) (no signup, browser-friendly), ask you to pick a topic name, store it as a secret, and define a new skill called something like `send_phone_notification`. The skill becomes a real callable tool on the very next chat turn. Then you say *"send me a test"* and your phone buzzes.

> "Build a skill that can summarize a YouTube video."

BabyAgent will design a skill that calls `r.jina.ai` against the video URL (which returns the title, description, and any auto-captions as plain text), then answers questions about it. No key, no signup.

> "I want to be able to post messages to my Discord server."

BabyAgent will ask you to create a Discord webhook in your server, paste the URL, and store it as a secret. It'll then build a `post_to_discord` skill and immediately use it. Big "oh wow" moment for the room.

The two most important things to understand here:

1. BabyAgent does this all from a built-in tool called `create_skill`. The tool takes a structured spec (id, inputs, HTTP request with `{{input.X}}` and `{{secrets.Y}}` templating) and registers a new callable tool out of pure data. There is no code generation. There is no compilation. The skill exists in `localStorage` as JSON, and a single ~80-line generic interpreter (`code/engine/http_runner.ts`) executes it whenever it's called.
2. BabyAgent knows which APIs work directly from the browser (Discord webhooks, ntfy.sh, GitHub public API, Tavily, OpenWeather, Telegram bot API, etc.) and which need a server proxy (Notion, Resend, Linear, Slack Web API, real email APIs). For browser-friendly APIs you can run BabyAgent anywhere. For proxy-required APIs you need to be running locally — see below.

### 4. Edit anything by hand

BabyAgent's behavior is entirely shaped by the markdown files in its filesystem. If you don't like something it's doing, open the relevant file in the editor and rewrite it. Save. The next chat turn will use your edits. This is the whole game: humans and the agent collaboratively maintain a small library of markdown files that define the agent's soul.

You can also click **Restart** in the top nav at any time to wipe everything (files, chat, secrets, custom skills) and start over with a clean slate.

---

## Local mode vs hosted mode

BabyAgent is the same code in both modes, but the runtime behavior differs in one important way:

| | Hosted mode (Vercel) | Local mode (`bun dev`) |
|---|---|---|
| API keys storage | Browser localStorage | Browser localStorage |
| Browser-friendly skills | ✅ Work | ✅ Work |
| Proxy-required skills (Notion, Resend, etc.) | ❌ Blocked by CORS | ✅ Routed through `/api/proxy` |
| Privacy story | Your laptop sees no extra hops | Your laptop is the only server in the loop |

The mode badge in the top nav shows which mode you're in. Click it for a full explainer. **The key insight:** when you run BabyAgent locally, your own laptop becomes the server. The proxy route at `/api/proxy` runs on your Node.js process, not on Vercel, not on anyone else's infrastructure. That means it can call APIs that block direct browser requests. That's how you unlock Notion, real email, etc.

---

## Run it locally

Requires [Bun](https://bun.sh) (or use `npm` / `pnpm`).

```bash
gh repo clone Overclock-Accelerator/babyagent
cd babyagent
bun install
bun dev
```

Open <http://localhost:3000>. Sign in with the workshop password, paste your Anthropic key into Settings, and start raising your agent.

When running locally the mode badge in the top nav turns green ("Local · Proxy On") and proxy-required skills become available.

---

## Architecture in one page

```
Browser
├── localStorage
│   ├── babyagent_vfs_v1         ← virtual filesystem (path → contents)
│   ├── babyagent_chat_v1        ← chat history
│   ├── babyagent_secrets_v1     ← user-defined secrets (NOTION_TOKEN, etc.)
│   ├── babyagent_custom_skills_v1 ← skill specs created via create_skill
│   ├── babyagent_anthropic_key  ← provider keys
│   └── babyagent_perplexity_key
│
└── React UI
    ├── FileTree         ← reads VFS, double-click to open in editor
    ├── Editor           ← CodeMirror, edits write back to VFS
    ├── Chat             ← drives the agent loop
    ├── JourneyDialog    ← progress tracker, opt-in install buttons
    └── SettingsDialog   ← keys, secrets, custom skills

Each chat turn:
1. Read VFS from localStorage
2. Walk files in order, concatenate their contents into a system prompt
3. Compute the active tool list (built-ins + installed bundled skills + custom skills)
4. Call Anthropic with messages + system + tools
5. If response has tool_use blocks, run each handler (write_file, web_fetch,
   perplexity_research, custom skill via http_runner, etc.) and feed results
   back into another API call
6. Repeat until Claude returns a final text response
7. Display the response, save updated history
```

The entire runtime is in `lib/anthropic.ts`, `lib/prompt.ts`, and `lib/skills/httpRunner.ts`. About 250 lines. You can read all three in 10 minutes.

### Built-in tools (always available)

- **`write_file`** — BabyAgent uses this to author its own markdown files
- **`set_secret`** — Stores API keys/tokens shared in chat
- **`install_skill`** — Installs a bundled optional skill from chat
- **`create_skill`** — Defines a brand-new skill from a structured spec

### Bundled optional skills

- **`web_fetch`** — Fetch any URL via [r.jina.ai](https://r.jina.ai) (no key, browser-friendly)
- **`perplexity_research`** — Cited research via [Perplexity Sonar](https://docs.perplexity.ai) (key required)
- **`remember`** — Append a fact to `MEMORY.md`

### Adding a skill in your own fork

If you want to add a new bundled skill that ships with the codebase:

1. Create `lib/skills/myskill.ts` with a `tool` (Anthropic tool definition), a `handler` (async function), and a `markdown` description string
2. Register it in `lib/skills/index.ts` inside `BUILTIN_SKILLS`
3. Optionally add it to the journey (`lib/journey.ts`) or let users install it from chat or sandbox mode

The codebase is small enough to read in 30 minutes. That's intentional — it's a reference implementation, not a framework.

---

## Privacy & security

- **Your keys never leave your browser** in hosted mode. The deployed Vercel app has no backend that touches your secrets — every AI call goes directly from your browser to api.anthropic.com / api.perplexity.ai.
- **Local mode adds one hop**: browser → your localhost Node process → target API. Still no third party.
- The proxy route (`/api/proxy`) is **deliberately disabled** when the `VERCEL` environment variable is set, so the hosted deployment cannot accidentally become an open API gateway.
- Secrets in `localStorage` are masked in the UI (only the last 4 characters shown).
- **Restart** wipes all four localStorage keys (VFS, chat, secrets, custom skills) so you can hand a laptop to the next person without leaking anything.

---

## Troubleshooting

**"BabyAgent says I'm a blank slate even though I have files"**
Click **Clear** in the chat header. The greeting is recomputed from your current VFS and will say "Hi again" instead.

**"Custom skill returns a CORS error"**
The target API blocks browser-direct requests. Either (a) re-create the skill with `proxy: true` and run BabyAgent locally, or (b) use a webhook-friendly alternative like Discord webhooks, Slack incoming webhooks, ntfy.sh, or webhook.site.

**"The agent name in the UI didn't update"**
The name is extracted from `IDENTITY.md` using a few patterns (`Name: X`, `# X`, `I am X`, `My name is X`). If BabyAgent wrote IDENTITY.md without one of these forms, open the file and add a `Name: X` line on the first row.

**"I want to start completely over"**
Click **Restart** in the top nav. It wipes the VFS, chat history, secrets, and custom skills. The system folder and the journey reset.

---

## Credits

Built for **[Overclock Accelerator](https://overclockaccelerator.com)** by [Ahmed Haque](https://overclockaccelerator.com), with massive collaboration from Claude. Visual design references [`pgpf-support-simulator`](https://github.com/Overclock-Accelerator/pgpf-support-simulator) — same Swiss-poster aesthetic, same workshop family.

## License

MIT © [Overclock Accelerator](https://overclockaccelerator.com)
