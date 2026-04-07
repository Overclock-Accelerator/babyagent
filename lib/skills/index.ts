import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { writeFileSkill, writeFileMarkdown } from './writeFile'
import { webFetchSkill, webFetchMarkdown } from './webFetch'
import { perplexitySkill, perplexityMarkdown } from './perplexity'
import { rememberSkill, rememberMarkdown } from './remember'

export type SkillHandler = (input: any, ctx: SkillContext) => Promise<string>

export type SkillContext = {
  perplexityKey?: string
}

export type Skill = {
  id: string
  name: string
  description: string
  markdown: string
  tool: Tool
  handler: SkillHandler
  needsKey?: 'perplexity'
  alwaysOn?: boolean // built-in skills (write_file) that don't need to be installed
}

export const ALL_SKILLS: Skill[] = [
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
    description: 'Run a real research query via Perplexity Sonar — gets cited, current answers.',
    markdown: perplexityMarkdown,
    tool: perplexitySkill.tool,
    handler: perplexitySkill.handler,
    needsKey: 'perplexity',
  },
  {
    id: 'remember',
    name: 'Remember',
    description: 'Append a fact to MEMORY.md so BabyAgent remembers it across conversations.',
    markdown: rememberMarkdown,
    tool: rememberSkill.tool,
    handler: rememberSkill.handler,
  },
]

export function getSkill(id: string): Skill | undefined {
  return ALL_SKILLS.find(s => s.id === id)
}

export function getActiveSkills(installedIds: string[]): Skill[] {
  return ALL_SKILLS.filter(s => s.alwaysOn || installedIds.includes(s.id))
}

export function getActiveTools(installedIds: string[]): Tool[] {
  return getActiveSkills(installedIds).map(s => s.tool)
}
