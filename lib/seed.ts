// The very first state of BabyAgent. Materialized into the VFS on first visit.

import { writeFileMarkdown } from './skills/writeFile'
import { createSkillMarkdown } from './skills/createSkill'
import { setSecretMarkdown } from './skills/setSecret'
import { installSkillMarkdown } from './skills/installSkill'

// Real source code of every built-in skill, the engine, and the generic
// custom-skill runner. Loaded as strings via Next.js raw imports
// (see next.config.ts) and seeded into the VFS under code/ so students can
// read what actually runs when BabyAgent calls a tool.
import writeFileSrc from './skills/writeFile.ts?raw'
import setSecretSrc from './skills/setSecret.ts?raw'
import installSkillSrc from './skills/installSkill.ts?raw'
import createSkillSrc from './skills/createSkill.ts?raw'
import webFetchSrc from './skills/webFetch.ts?raw'
import perplexitySrc from './skills/perplexity.ts?raw'
import rememberSrc from './skills/remember.ts?raw'
import skillsIndexSrc from './skills/index.ts?raw'
import httpRunnerSrc from './skills/httpRunner.ts?raw'
import anthropicSrc from './anthropic.ts?raw'
import promptSrc from './prompt.ts?raw'

export const SEED_CLAUDE_MD = `# BabyAgent

I don't know anything yet.

No user. No mission. No goals. No memory. No installed skills.

But I do have four built-in tools that are always available — see the \`system/\` folder on the left for what they do, and the \`code/\` folder for the actual TypeScript that runs when I call them.

Talk to me and I'll grow up.
`

export const SEED_SYSTEM_README = `# system/

This folder describes the **built-in tools** that BabyAgent always has access to, regardless of which optional skills you install. They are the foundation of how BabyAgent grows.

Unlike the files in \`skills/\` (which can be installed, uninstalled, or created on the fly), these four tools are baked into the codebase and cannot be removed:

- **write_file** — BabyAgent uses this to materialize new markdown files (USER.md, MISSION.md, etc) into its own filesystem as you converse. This is how it writes its own soul.
- **set_secret** — BabyAgent uses this to store API keys and tokens you share mid-conversation. Stored in your browser's localStorage only.
- **install_skill** — BabyAgent uses this to install one of the bundled optional skills (web_fetch, perplexity_research, remember) directly from chat. No buttons required — just ask for the capability.
- **create_skill** — BabyAgent uses this to define brand-new skills on the fly. When you say "give yourself the ability to send me a Discord message", this is the tool it calls to bring that skill into existence.

Open any of the files in this folder to read the **human-readable description** — what the tool does, when to use it, what its inputs are.

> **Want to see the actual TypeScript that runs?** Open the \`code/\` folder. Every built-in skill has its real source mirrored there.
`

export const SEED_CODE_README = `# code/

The actual TypeScript that runs when BabyAgent calls a tool.

Everything in \`system/\` and \`skills/\` is **documentation** — markdown for humans (and for BabyAgent's narrative context). The files in this folder are the **truth**: real code that executes inside your browser whenever a tool is invoked.

Two layers:

## skills/ — one file per built-in skill

Each file defines:
1. A **markdown description** (the same string that appears in \`system/\` or \`skills/\`)
2. An **Anthropic Tool definition** — the JSON schema that Claude reads to know the tool exists and how to call it
3. A **handler function** — the real async code that runs when Claude calls the tool

When BabyAgent emits a \`tool_use\` block in its response, the engine looks up the matching handler in this layer and runs it. The result is fed back to Claude on the next loop iteration.

| File | What it is |
|---|---|
| \`code/skills/write_file.ts\` | The built-in that lets BabyAgent author markdown files |
| \`code/skills/set_secret.ts\` | The built-in that stores API keys in localStorage |
| \`code/skills/install_skill.ts\` | The built-in that installs other bundled skills from chat |
| \`code/skills/create_skill.ts\` | The built-in that defines brand-new skills on the fly |
| \`code/skills/web_fetch.ts\` | Bundled optional skill: fetch any URL via r.jina.ai |
| \`code/skills/perplexity_research.ts\` | Bundled optional skill: cited research via Perplexity Sonar |
| \`code/skills/remember.ts\` | Bundled optional skill: append a fact to MEMORY.md |
| \`code/skills/index.ts\` | The skill registry that wires everything up |

## engine/ — the runtime that calls them

These three files are the entire BabyAgent runtime. About 250 lines total. If you read these, you understand how every agent in the world works under the hood.

| File | What it is |
|---|---|
| \`code/engine/agent_loop.ts\` | The tool-use loop. Calls Claude, dispatches tool_use blocks to handlers, feeds results back, repeats. |
| \`code/engine/system_prompt.ts\` | Reassembles the system prompt from the VFS on every turn. The "memory" of the agent. |
| \`code/engine/http_runner.ts\` | The single function that powers EVERY chat-created custom skill. Interpolates \`{{input.X}}\` and \`{{secrets.Y}}\` into a request spec and calls fetch. ~80 lines. |

## The big idea

A "skill" is not a special kind of code. It's a **JSON document plus a generic interpreter** (for custom skills) or **a TypeScript handler plus a tool definition** (for built-ins). The interpreter is small. The agent loop is small. The system prompt assembler is small. There's no magic — there's just text being passed between a model and some functions.

These files are read-only documentation. Editing them in the BabyAgent editor doesn't change BabyAgent's actual behavior — to change the real source you'd have to fork the repo and edit the files in \`lib/skills/\`.
`

export const BLANK_SLATE_GREETING = `Hi. I'm BabyAgent. 🐣

I don't know anything yet — not even who you are. I have no mission, no goals, no memory, and no installed skills. I literally cannot do much for you in this state.

But here's the cool part: **I can grow.** Every time you tell me something about you or about what I should do, I'll write it into a markdown file on the left. Those files become *my soul*. The more you give me, the more capable I become.

Want to help me grow up? Let's start with **you**. What's your name, and what do you do?`

// Build a context-aware greeting based on what files already exist in the VFS.
// Used both on first load and after the user clears the chat — so a returning
// user doesn't get re-introduced as a blank slate when they clearly aren't.
export function buildGreeting(vfs: Record<string, string>, agentName: string): string {
  const hasUser = !!vfs['USER.md']
  const hasMission = !!vfs['MISSION.md']
  const hasGoals = !!vfs['GOALS.md']
  const hasMemory = !!vfs['MEMORY.md']
  const installedSkills = Object.keys(vfs).filter(p => p.startsWith('skills/') && p.endsWith('.md'))

  if (!hasUser && !hasMission) return BLANK_SLATE_GREETING

  const loaded: string[] = []
  if (hasUser) loaded.push('who you are')
  if (hasMission) loaded.push('my mission')
  if (hasGoals) loaded.push('your goals')
  if (hasMemory) loaded.push('what to remember')
  const loadedText = loaded.length ? loaded.join(', ') : 'some context'

  const skillsText = installedSkills.length > 0
    ? ` I have ${installedSkills.length} skill${installedSkills.length === 1 ? '' : 's'} installed (see the skills/ folder).`
    : ''

  return `Hi again. I'm ${agentName} — your context is loaded (${loadedText}).${skillsText}\n\nWhat can I help you with?`
}

export const SEED_FILES: Record<string, string> = {
  'CLAUDE.md': SEED_CLAUDE_MD,

  // system/ — human-readable docs that also enter Claude's context
  'system/README.md': SEED_SYSTEM_README,
  'system/write_file.md': writeFileMarkdown,
  'system/set_secret.md': setSecretMarkdown,
  'system/install_skill.md': installSkillMarkdown,
  'system/create_skill.md': createSkillMarkdown,

  // code/ — the actual TypeScript that runs
  'code/README.md': SEED_CODE_README,
  'code/skills/write_file.ts': writeFileSrc,
  'code/skills/set_secret.ts': setSecretSrc,
  'code/skills/install_skill.ts': installSkillSrc,
  'code/skills/create_skill.ts': createSkillSrc,
  'code/skills/web_fetch.ts': webFetchSrc,
  'code/skills/perplexity_research.ts': perplexitySrc,
  'code/skills/remember.ts': rememberSrc,
  'code/skills/index.ts': skillsIndexSrc,
  'code/engine/agent_loop.ts': anthropicSrc,
  'code/engine/system_prompt.ts': promptSrc,
  'code/engine/http_runner.ts': httpRunnerSrc,
}
