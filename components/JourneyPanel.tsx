'use client'

import { useEffect, useState } from 'react'
import { Check, Lock, Sparkles, Plus, X } from 'lucide-react'
import { JOURNEY, currentStep, progress } from '@/lib/journey'
import { ALL_SKILLS } from '@/lib/skills'
import { loadVFS, writeFile } from '@/lib/vfs'

interface Props {
  open: boolean
  onClose: () => void
}

export default function JourneyDialog({ open, onClose }: Props) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick(t => t + 1)
    window.addEventListener('babyagent-vfs-changed', refresh)
    return () => window.removeEventListener('babyagent-vfs-changed', refresh)
  }, [])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const vfs = loadVFS()
  const cur = currentStep(vfs)
  const { done, total } = progress(vfs)
  const allDone = !cur

  function installSkill(id: string) {
    const skill = ALL_SKILLS.find(s => s.id === id)
    if (!skill) return
    writeFile(`skills/${id}.md`, skill.markdown)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white border-2 border-swiss-ink shadow-[8px_8px_0_0_rgba(12,12,12,0.25)] w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-stretch border-b-2 border-swiss-ink shrink-0">
          <div className="w-2 bg-swiss-sage shrink-0" aria-hidden />
          <div className="flex flex-1 items-center justify-between px-4 py-3 min-w-0">
            <div>
              <p className="label-poster text-swiss-sage">{allDone ? 'Sandbox mode' : 'Journey'}</p>
              <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink">
                {allDone ? 'Free play' : `Step ${done + 1} of ${total}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex gap-1">
                  {JOURNEY.map(s => (
                    <span
                      key={s.id}
                      className={`w-2.5 h-2.5 border border-swiss-ink ${s.isComplete(vfs) ? 'bg-swiss-orange' : 'bg-white'}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">{done}/{total}</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-swiss-beige/40">
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 scrollbar-thin space-y-3">
          {!allDone && cur && <CurrentStepCard step={cur} onInstall={installSkill} />}
          {allDone && <SandboxView onInstall={installSkill} />}

          <div className="pt-2">
            <p className="label-poster text-swiss-sage mb-2">All steps</p>
            <ol className="space-y-1.5">
              {JOURNEY.map((s) => {
                const isDone = s.isComplete(vfs)
                const isCurrent = !isDone && cur?.id === s.id
                return (
                  <li
                    key={s.id}
                    className={`flex items-start gap-2 text-xs px-2 py-1.5 border-l-2 ${
                      isDone ? 'border-swiss-orange bg-swiss-orange/5' : isCurrent ? 'border-swiss-blue bg-sky-50' : 'border-neutral-200'
                    }`}
                  >
                    <span className="shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
                      {isDone ? <Check className="w-3.5 h-3.5 text-swiss-orange" /> : isCurrent ? <Sparkles className="w-3.5 h-3.5 text-swiss-blue" /> : <Lock className="w-3 h-3 text-neutral-300" />}
                    </span>
                    <div className="min-w-0">
                      <p className={`font-bold uppercase tracking-wider ${isDone ? 'text-swiss-ink line-through opacity-60' : isCurrent ? 'text-swiss-ink' : 'text-neutral-400'}`}>
                        {s.id}. {s.title}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

function CurrentStepCard({ step, onInstall }: { step: ReturnType<typeof currentStep>; onInstall: (id: string) => void }) {
  if (!step) return null
  return (
    <div className="border-2 border-swiss-ink bg-swiss-beige/30 p-3 shadow-[3px_3px_0_0_rgba(12,12,12,0.15)]">
      <p className="label-poster text-swiss-blue">Next up</p>
      <p className="mt-1 text-base font-bold uppercase tracking-wide text-swiss-ink">{step.title}</p>
      <p className="mt-2 text-xs text-neutral-700 leading-relaxed">{step.hint}</p>
      {step.kind === 'skill' && (
        <button
          onClick={() => onInstall(step.target)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-swiss-orange hover:bg-[#cf5204] text-white border-2 border-swiss-ink px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_rgba(12,12,12,1)] hover:shadow-[1px_1px_0_0_rgba(12,12,12,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Install {step.target}
        </button>
      )}
      {step.kind === 'file' && (
        <p className="mt-3 text-[11px] italic text-neutral-500">
          Just chat with BabyAgent — when you answer, it will write <span className="font-mono font-bold">{step.target}</span> for you. Or open the file directly in the editor.
        </p>
      )}
    </div>
  )
}

function SandboxView({ onInstall }: { onInstall: (id: string) => void }) {
  const vfs = loadVFS()
  const installed = new Set(
    Object.keys(vfs).filter(p => p.startsWith('skills/')).map(p => p.replace('skills/', '').replace('.md', ''))
  )
  const optional = ALL_SKILLS.filter(s => !s.alwaysOn && !installed.has(s.id))

  return (
    <div className="border-2 border-swiss-ink bg-swiss-beige/30 p-3 shadow-[3px_3px_0_0_rgba(12,12,12,0.15)]">
      <p className="label-poster text-swiss-blue">Free play</p>
      <p className="mt-1 text-base font-bold uppercase tracking-wide text-swiss-ink">You did it.</p>
      <p className="mt-2 text-xs text-neutral-700 leading-relaxed">
        BabyAgent is fully scaffolded. Keep chatting, edit any file, or bolt on more skills below.
      </p>
      {optional.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="label-poster text-swiss-sage">Add more skills</p>
          {optional.map(s => (
            <div key={s.id} className="border-2 border-swiss-ink bg-white p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-swiss-ink">{s.name}</p>
                <button
                  onClick={() => onInstall(s.id)}
                  className="text-[10px] font-bold uppercase tracking-wider bg-swiss-orange text-white border-2 border-swiss-ink px-2 py-1 shadow-[1px_1px_0_0_rgba(12,12,12,1)]"
                >
                  Install
                </button>
              </div>
              <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{s.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] italic text-neutral-500">All available skills are installed. Want more? Edit the code in <span className="font-mono">lib/skills/</span>.</p>
      )}
    </div>
  )
}
