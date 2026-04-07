'use client'

import { useEffect, useState } from 'react'
import { X, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react'
import {
  getAnthropicKey, setAnthropicKey,
  getPerplexityKey, setPerplexityKey,
  getModel, setModel, DEFAULT_MODEL,
} from '@/lib/anthropic'

const MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5 (recommended)' },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1 (smarter, slower)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (fastest)' },
]

export default function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [aKey, setAKey] = useState('')
  const [pKey, setPKey] = useState('')
  const [model, setMod] = useState(DEFAULT_MODEL)
  const [showA, setShowA] = useState(false)
  const [showP, setShowP] = useState(false)
  const [needsKey, setNeedsKey] = useState(false)

  useEffect(() => {
    setAKey(getAnthropicKey())
    setPKey(getPerplexityKey())
    setMod(getModel())
    if (!getAnthropicKey()) {
      setOpen(true)
      setNeedsKey(true)
    }
  }, [])

  function save() {
    setAnthropicKey(aKey.trim())
    setPerplexityKey(pKey.trim())
    setModel(model)
    setOpen(false)
    setNeedsKey(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Settings"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-swiss-ink bg-white hover:bg-swiss-beige/40 border-2 border-swiss-ink px-3 py-2 shadow-[2px_2px_0_0_rgba(12,12,12,1)] hover:shadow-[1px_1px_0_0_rgba(12,12,12,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
      >
        <SettingsIcon className="w-3.5 h-3.5" />
        Settings
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border-2 border-swiss-ink shadow-[8px_8px_0_0_rgba(12,12,12,0.25)] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-stretch border-b-2 border-swiss-ink">
              <div className="w-2 bg-swiss-blue" aria-hidden />
              <div className="flex flex-1 items-center justify-between px-4 py-3">
                <div>
                  <p className="label-poster text-swiss-sage">Configuration</p>
                  <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink">Settings</p>
                </div>
                {!needsKey && (
                  <button onClick={() => setOpen(false)} className="p-1 hover:bg-swiss-beige/40">
                    <X className="w-4 h-4 text-neutral-600" />
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 py-5 space-y-5">
              {needsKey && (
                <div className="border-2 border-swiss-orange bg-swiss-orange/10 px-3 py-2.5">
                  <p className="text-xs text-swiss-ink font-medium">
                    BabyAgent needs an Anthropic API key before it can think. Get one at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-swiss-blue underline font-bold">console.anthropic.com</a>. It stays in your browser — never sent anywhere except to Anthropic.
                  </p>
                </div>
              )}

              <div>
                <label className="block label-poster text-neutral-600 mb-1.5">Anthropic API Key (required)</label>
                <div className="flex items-center border-2 border-neutral-300 focus-within:border-swiss-orange transition-colors">
                  <input
                    type={showA ? 'text' : 'password'}
                    value={aKey}
                    onChange={(e) => setAKey(e.target.value)}
                    placeholder="sk-ant-…"
                    className="flex-1 px-3 py-2 text-sm focus:outline-none font-mono"
                  />
                  <button onClick={() => setShowA(!showA)} className="px-3 text-neutral-500 hover:text-swiss-ink">
                    {showA ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block label-poster text-neutral-600 mb-1.5">Perplexity API Key (optional)</label>
                <div className="flex items-center border-2 border-neutral-300 focus-within:border-swiss-orange transition-colors">
                  <input
                    type={showP ? 'text' : 'password'}
                    value={pKey}
                    onChange={(e) => setPKey(e.target.value)}
                    placeholder="pplx-…"
                    className="flex-1 px-3 py-2 text-sm focus:outline-none font-mono"
                  />
                  <button onClick={() => setShowP(!showP)} className="px-3 text-neutral-500 hover:text-swiss-ink">
                    {showP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Only needed if you install the perplexity_research skill.</p>
              </div>

              <div>
                <label className="block label-poster text-neutral-600 mb-1.5">Model</label>
                <select
                  value={model}
                  onChange={(e) => setMod(e.target.value)}
                  className="w-full border-2 border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-swiss-orange bg-white"
                >
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="border-t-2 border-neutral-200 pt-3">
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  🔒 Your keys are stored only in your browser&rsquo;s localStorage. They are never sent to any server other than the AI provider you&rsquo;re using.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t-2 border-swiss-ink bg-swiss-beige/30">
              {!needsKey && (
                <button onClick={() => setOpen(false)} className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-swiss-ink border-2 border-transparent hover:border-swiss-ink px-3 py-2 transition-colors">
                  Cancel
                </button>
              )}
              <button
                onClick={save}
                disabled={!aKey.trim()}
                className="text-xs font-bold uppercase tracking-wider bg-swiss-orange hover:bg-[#cf5204] disabled:opacity-40 disabled:cursor-not-allowed text-white border-2 border-swiss-ink px-3 py-2 shadow-[2px_2px_0_0_rgba(12,12,12,1)] hover:shadow-[1px_1px_0_0_rgba(12,12,12,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
