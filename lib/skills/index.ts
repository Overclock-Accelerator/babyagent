import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { writeFileSkill, writeFileMarkdown } from './writeFile'
import { webFetchSkill, webFetchMarkdown } from './webFetch'
import { perplexitySkill, perplexityMarkdown } from './perplexity'
import { rememberSkill, rememberMarkdown } from './remember'
import { createSkillSkill, createSkillMarkdown } from './createSkill'
import { setSecretSkill, setSecretMarkdown } from './setSecret'
import { installSkillTool, installSkillMarkdown } from './installSkill'
import { loadCustomSkills, specToTool, type CustomSkillSpec } from '../customSkills'
import { runCustomSkill } from './httpRunner'
import { writeFile } from '../vfs'

export type SkillHandler = (input: any, ctx: SkillContext) => Promise<string>

export type SkillContext = {
  perplexityKey?: string
  secrets: Record<string, string>
}

export type Skill = {
  id: string
  name: string
  description: string
  markdown: string
  tool: Tool
  handler: SkillHandler
  needsKey?: 'perplexity'
  alwaysOn?: boolean // built-in skills that don't need to be installed
}

// Built-in skills (the ones that ship with BabyAgent)
export const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'write_file',
    name: 'Write File',
    description: "Create or update a markdown file in BabyAgent's virtual filesystem.",
    markdown: writeFileMarkdown,
    tool: writeFileSkill.tool,
    handler: writeFileSkill.handler,
    alwaysOn: true,
  },
  {
    id: 'create_skill',
    name: 'Create Skill',
    description: 'Define a brand-new skill on the fly from chat answers.',
    markdown: createSkillMarkdown,
    tool: createSkillSkill.tool,
    handler: createSkillSkill.handler,
    alwaysOn: true,
  },
  {
    id: 'set_secret',
    name: 'Set Secret',
    description: "Store an API key or token in the user's browser.",
    markdown: setSecretMarkdown,
    tool: setSecretSkill.tool,
    handler: setSecretSkill.handler,
    alwaysOn: true,
  },
  {
    id: 'install_skill',
    name: 'Install Skill',
    description: 'Install one of the bundled optional skills from chat.',
    markdown: installSkillMarkdown,
    tool: installSkillTool,
    handler: async (input: { id: string }) => {
      if (!input.id) return 'ERROR: install_skill requires an `id`.'
      const skill = BUILTIN_SKILLS.find(s => s.id === input.id && !s.alwaysOn)
      if (!skill) {
        const installable = BUILTIN_SKILLS.filter(s => !s.alwaysOn).map(s => s.id).join(', ')
        return `ERROR: '${input.id}' is not a bundled skill. Valid options: ${installable}. For brand-new capabilities, use create_skill instead.`
      }
      writeFile(`skills/${skill.id}.md`, skill.markdown)
      return `Installed ${skill.name} (id: ${skill.id}). It's available on your next turn.`
    },
    alwaysOn: true,
  },
  {
    id: 'web_fetch',
    name: 'Web Fetch',
    description: 'Fetch the text contents of a URL on the public web.',
    markdown: webFetchMarkdown,
    tool: webFetchSkill.tool,
    handler: webFetchSkill.handler,
  },
  {
    id: 'perplexity_research',
    name: 'Perplexity Research',
    description: 'Run a real research query via Perplexity Sonar.',
    markdown: perplexityMarkdown,
    tool: perplexitySkill.tool,
    handler: perplexitySkill.handler,
    needsKey: 'perplexity',
  },
  {
    id: 'remember',
    name: 'Remember',
    description: 'Append a fact to MEMORY.md.',
    markdown: rememberMarkdown,
    tool: rememberSkill.tool,
    handler: rememberSkill.handler,
  },
]

// Convert a custom skill spec into a runnable Skill object.
function customSpecToSkill(spec: CustomSkillSpec): Skill {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    markdown: '', // already written to VFS by createSkill handler
    tool: specToTool(spec),
    handler: async (input, ctx) => runCustomSkill(spec, input ?? {}, ctx.secrets),
  }
}

// Get all skills currently available: built-ins + any custom ones the user has created.
export function getAllSkills(): Skill[] {
  const customs = loadCustomSkills().map(customSpecToSkill)
  return [...BUILTIN_SKILLS, ...customs]
}

export function getSkill(id: string): Skill | undefined {
  return getAllSkills().find(s => s.id === id)
}

// Active skills = built-in always-on + installed built-ins (skills/X.md present) + all custom skills
export function getActiveSkills(installedIds: string[]): Skill[] {
  const customs = loadCustomSkills().map(customSpecToSkill)
  const builtins = BUILTIN_SKILLS.filter(s => s.alwaysOn || installedIds.includes(s.id))
  return [...builtins, ...customs]
}

export function getActiveTools(installedIds: string[]): Tool[] {
  return getActiveSkills(installedIds).map(s => s.tool)
}

// Backwards-compat alias for any caller still using ALL_SKILLS
export const ALL_SKILLS = BUILTIN_SKILLS
