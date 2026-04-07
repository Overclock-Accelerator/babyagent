// The very first state of BabyAgent. Materialized into the VFS on first visit.

import { writeFileMarkdown } from './skills/writeFile'
import { createSkillMarkdown } from './skills/createSkill'
import { setSecretMarkdown } from './skills/setSecret'
import { installSkillMarkdown } from './skills/installSkill'

export const SEED_CLAUDE_MD = `# BabyAgent

I don't know anything yet.

No user. No mission. No goals. No memory. No installed skills.

But I do have three built-in tools that are always available — see the \`system/\` folder on the left.

Talk to me and I'll grow up.
`

export const SEED_SYSTEM_README = `# system/

This folder describes the **built-in tools** that BabyAgent always has access to, regardless of which optional skills you install. They are the foundation of how BabyAgent grows.

Unlike the files in \`skills/\` (which can be installed, uninstalled, or created on the fly), these four tools are baked into the codebase and cannot be removed:

- **write_file** — BabyAgent uses this to materialize new markdown files (USER.md, MISSION.md, etc) into its own filesystem as you converse. This is how it writes its own soul.
- **set_secret** — BabyAgent uses this to store API keys and tokens you share mid-conversation. Stored in your browser's localStorage only.
- **install_skill** — BabyAgent uses this to install one of the bundled optional skills (web_fetch, perplexity_research, remember) directly from chat. No buttons required — just ask for the capability.
- **create_skill** — BabyAgent uses this to define brand-new skills on the fly. When you say "give yourself the ability to send me a Discord message", this is the tool it calls to bring that skill into existence.

Open any of the files in this folder to read the full tool spec. Editing them does not change BabyAgent's behavior — these are reference docs for you, the human.
`

export const SEED_FILES: Record<string, string> = {
  'CLAUDE.md': SEED_CLAUDE_MD,
  'system/README.md': SEED_SYSTEM_README,
  'system/write_file.md': writeFileMarkdown,
  'system/set_secret.md': setSecretMarkdown,
  'system/install_skill.md': installSkillMarkdown,
  'system/create_skill.md': createSkillMarkdown,
}

export const FIRST_GREETING = `Hi. I'm BabyAgent. 🐣

I don't know anything yet — not even who you are. I have no mission, no goals, no memory, and no skills. I literally cannot do much for you in this state.

But here's the cool part: **I can grow.** Every time you tell me something about you or about what I should do, I'll write it into a markdown file on the left. Those files become *my soul*. The more you give me, the more capable I become.

Want to help me grow up? Let's start with **you**. What's your name, and what do you do?`
