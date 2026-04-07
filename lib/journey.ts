// The 7-step linear journey. Each step has a target file or skill, a label,
// and a completion predicate that reads the VFS.

import type { VFS } from './vfs'

export type JourneyStep = {
  id: number
  title: string
  hint: string
  isComplete: (vfs: VFS) => boolean
  kind: 'file' | 'skill'
  target: string // file path OR skill id
}

function nonEmptyFile(path: string) {
  return (vfs: VFS) => Boolean(vfs[path] && vfs[path].trim().length > 10)
}

export const JOURNEY: JourneyStep[] = [
  {
    id: 1,
    title: 'About You',
    hint: "Tell BabyAgent who you are — your name, what you do, how you want to be talked to.",
    kind: 'file',
    target: 'USER.md',
    isComplete: nonEmptyFile('USER.md'),
  },
  {
    id: 2,
    title: 'Identity',
    hint: 'Give BabyAgent a name, personality, and voice. (Or let it suggest one.)',
    kind: 'file',
    target: 'IDENTITY.md',
    isComplete: nonEmptyFile('IDENTITY.md'),
  },
  {
    id: 3,
    title: 'Mission',
    hint: 'What is BabyAgent for? Its single purpose in your life.',
    kind: 'file',
    target: 'MISSION.md',
    isComplete: nonEmptyFile('MISSION.md'),
  },
  {
    id: 4,
    title: 'Goals',
    hint: 'Concrete things BabyAgent should help you accomplish.',
    kind: 'file',
    target: 'GOALS.md',
    isComplete: nonEmptyFile('GOALS.md'),
  },
  {
    id: 5,
    title: 'Memory',
    hint: 'Seed facts worth remembering across conversations.',
    kind: 'file',
    target: 'MEMORY.md',
    isComplete: nonEmptyFile('MEMORY.md'),
  },
  {
    id: 6,
    title: 'First Skill — Web Fetch',
    hint: "Give BabyAgent the ability to read URLs. No API key needed. Click 'Install' below to add it.",
    kind: 'skill',
    target: 'web_fetch',
    isComplete: (vfs) => Boolean(vfs['skills/web_fetch.md']),
  },
  {
    id: 7,
    title: 'Second Skill — Perplexity Research',
    hint: 'Real research with citations. Needs a Perplexity API key (Settings → gear icon).',
    kind: 'skill',
    target: 'perplexity_research',
    isComplete: (vfs) => Boolean(vfs['skills/perplexity_research.md']),
  },
]

export function currentStep(vfs: VFS): JourneyStep | null {
  for (const step of JOURNEY) {
    if (!step.isComplete(vfs)) return step
  }
  return null // all done → sandbox mode
}

export function progress(vfs: VFS): { done: number; total: number } {
  const done = JOURNEY.filter(s => s.isComplete(vfs)).length
  return { done, total: JOURNEY.length }
}
