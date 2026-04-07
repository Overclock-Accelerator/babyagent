'use client'

import { useEffect, useState } from 'react'
import { X, Settings as SettingsIcon, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import {
  getAnthropicKey, setAnthropicKey,
  getPerplexityKey, setPerplexityKey,
  getModel, setModel, DEFAULT_MODEL,
} from '@/lib/anthropic'
import { loadSecrets, setSecret as saveSecret, deleteSecret } from '@/lib/secrets'
import { loadCustomSkills, deleteCustomSkill, type CustomSkillSpec } from '@/lib/customSkills'

const MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5 (recommended)' },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1 (smarter, slower)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (fastest)' },
]

export default function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'keys' | 'secrets' | 'skills'>('keys')
  const [aKey, setAKey] = useState('')
  const [pKey, setPKey] = useState('')
  const [model, setMod] = useState(DEFAULT_MODEL)
  const [showA, setShowA] = useState(false)
  const [showP, setShowP] = useState(false)
  const [needsKey, setNeedsKey] = useState(false)
  const [secrets, setSecretsState] = useState<Record<string, string>>({})
  const [customs, setCustoms] = useState<CustomSkillSpec[]>([])
  const [newSecKey, setNewSecKey] = useState('')
  const [newSecVal, setNewSecVal] = useState('')

  function refreshSecrets() {
    setSecretsState(loadSecrets())
    setCustoms(loadCustomSkills())
  }

  useEffect(() => {
    setAKey(getAnthropicKey())
    setPKey(getPerplexityKey())
    setMod(getModel())
    refreshSecrets()
    if (!getAnthropicKey()) {
      setOpen(true)
      setNeedsKey(true)
    }
    const refresh = () => refreshSecrets()
    window.addEventListener('babyagent-secrets-changed', refresh)
    window.addEventListener('babyagent-custom-skills-changed', refresh)
    return () => {
      window.removeEventListener('babyagent-secrets-changed', refresh)
      window.removeEventListener('babyagent-custom-skills-changed', refresh)
    }
  }, [])

  function addSecret() {
    if (!newSecKey.trim() || !newSecVal.trim()) return
    saveSecret(newSecKey.trim(), newSecVal.trim())
    setNewSecKey('')
    setNewSecVal('')
    refreshSecrets()
  }

  function removeSecret(key: string) {
    if (window.confirm(`Delete secret ${key}?`)) {
      deleteSecret(key)
      refreshSecrets()
    }
  }

  function removeCustomSkill(id: string) {
    if (window.confirm(`Delete custom skill ${id}? BabyAgent will lose this capability.`)) {
      deleteCustomSkill(id)
      refreshSecrets()
    }
  }

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
          <div className="bg-white border-2 border-swiss-ink shadow-[8px_8px_0_0_rgba(12,12,12,0.25)] w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-stretch border-b-2 border-swiss-ink shrink-0">
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

            {!needsKey && (
              <div className="flex border-b-2 border-swiss-ink shrink-0 bg-swiss-beige/20">
                {(['keys', 'secrets', 'skills'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      tab === t ? 'bg-white text-swiss-ink border-b-2 border-swiss-orange -mb-[2px]' : 'text-neutral-500 hover:text-swiss-ink'
                    }`}
                  >
                    {t === 'keys' ? 'Provider Keys' : t === 'secrets' ? `Secrets (${Object.keys(secrets).length})` : `Custom Skills (${customs.length})`}
                  </button>
                ))}
              </div>
            )}

            <div className="px-5 py-5 space-y-5 overflow-y-auto scrollbar-thin">
              {tab === 'keys' && (<>
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
              </>)}

              {tab === 'secrets' && (
                <div className="space-y-4">
                  <div>
                    <p className="label-poster text-swiss-sage mb-1">What is this?</p>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      Secrets are arbitrary key/value pairs (API keys, webhook URLs, tokens) that custom skills can reference. BabyAgent can also create them for you mid-conversation when it builds a new skill — just tell it &ldquo;here&rsquo;s the API key&rdquo; and it will store it.
                    </p>
                  </div>

                  {Object.keys(secrets).length === 0 ? (
                    <p className="text-xs italic text-neutral-400 px-2 py-3 text-center border-2 border-dashed border-neutral-200">
                      No secrets stored yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {Object.entries(secrets).map(([k, v]) => (
                        <li key={k} className="border-2 border-swiss-ink p-2.5 bg-white">
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-xs font-bold text-swiss-ink truncate">{k}</code>
                            <button
                              onClick={() => removeSecret(k)}
                              className="text-neutral-400 hover:text-swiss-crimson p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <code className="block text-[10px] text-neutral-500 mt-1 truncate">
                            {v.length > 8 ? '••••' + v.slice(-4) : '•••'}
                          </code>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="border-t-2 border-neutral-200 pt-3">
                    <p className="label-poster text-neutral-600 mb-1.5">Add manually</p>
                    <div className="flex gap-2">
                      <input
                        value={newSecKey}
                        onChange={(e) => setNewSecKey(e.target.value)}
                        placeholder="KEY_NAME"
                        className="w-32 border-2 border-neutral-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-swiss-orange uppercase"
                      />
                      <input
                        value={newSecVal}
                        onChange={(e) => setNewSecVal(e.target.value)}
                        placeholder="value"
                        type="password"
                        className="flex-1 border-2 border-neutral-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-swiss-orange"
                      />
                      <button
                        onClick={addSecret}
                        disabled={!newSecKey.trim() || !newSecVal.trim()}
                        className="bg-swiss-orange disabled:opacity-30 text-white border-2 border-swiss-ink px-2 py-1.5 shadow-[2px_2px_0_0_rgba(12,12,12,1)]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'skills' && (
                <div className="space-y-3">
                  <div>
                    <p className="label-poster text-swiss-sage mb-1">Custom skills</p>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      Skills BabyAgent has built for you mid-conversation. Each one is a real callable tool. To create a new one, just tell BabyAgent in chat: <em>&ldquo;create a skill that posts to my Discord webhook.&rdquo;</em>
                    </p>
                  </div>
                  {customs.length === 0 ? (
                    <p className="text-xs italic text-neutral-400 px-2 py-3 text-center border-2 border-dashed border-neutral-200">
                      No custom skills yet. Ask BabyAgent to create one.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {customs.map((s) => (
                        <li key={s.id} className="border-2 border-swiss-ink p-2.5 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-swiss-ink truncate">{s.name}</p>
                              <code className="block text-[10px] text-swiss-blue mt-0.5">{s.id}</code>
                              <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{s.description}</p>
                              <p className="text-[10px] text-neutral-400 mt-1 font-mono">{s.request.method} {s.request.url.length > 50 ? s.request.url.slice(0, 50) + '…' : s.request.url}</p>
                            </div>
                            <button
                              onClick={() => removeCustomSkill(s.id)}
                              className="text-neutral-400 hover:text-swiss-crimson p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
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
