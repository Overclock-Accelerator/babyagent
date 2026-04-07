'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FileTree from '@/components/FileTree'
import Editor from '@/components/Editor'
import Chat from '@/components/Chat'
import JourneyDialog from '@/components/JourneyPanel'
import SettingsDialog from '@/components/SettingsDialog'
import CollapsedRail from '@/components/CollapsedRail'
import { LogOut, FolderTree, FileCode2, Compass, RotateCcw, Server, Cloud } from 'lucide-react'
import { loadVFS, saveVFS, resetVFS } from '@/lib/vfs'
import { useAgentName, DEFAULT_NAME } from '@/lib/agentName'
import { useMode } from '@/lib/mode'
import { SEED_FILES, FIRST_GREETING } from '@/lib/seed'

export default function LabPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [selected, setSelected] = useState<string | null>('CLAUDE.md')
  const [treeOpen, setTreeOpen] = useState(true)
  const [editorOpen, setEditorOpen] = useState(true)
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [modeInfoOpen, setModeInfoOpen] = useState(false)
  const agentName = useAgentName()
  const { mode, proxyEnabled } = useMode()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('babyagent_auth') !== 'true') {
      router.push('/')
      return
    }
    // Seed VFS on first visit
    const vfs = loadVFS()
    if (Object.keys(vfs).length === 0) {
      saveVFS({ ...SEED_FILES })
      // Auto-open Journey on the very first visit so users discover it
      setJourneyOpen(true)
    }
    setAuthed(true)
  }, [router])

  function handleLogout() {
    localStorage.removeItem('babyagent_auth')
    router.push('/')
  }

  function handleOpenFile(path: string) {
    setSelected(path)
    setEditorOpen(true)
  }

  function handleRestart() {
    if (window.confirm('Restart BabyAgent from a blank slate? This wipes all files, chat history, custom skills, and secrets.')) {
      resetVFS()
      localStorage.removeItem('babyagent_chat_v1')
      localStorage.removeItem('babyagent_custom_skills_v1')
      localStorage.removeItem('babyagent_secrets_v1')
      window.location.reload()
    }
  }

  if (!authed) return null

  return (
    <div className="h-screen flex flex-col bg-[#f4f3ef] overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 border-b-2 border-swiss-ink bg-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border-2 border-swiss-ink bg-swiss-orange/15 flex items-center justify-center">
              <span className="text-xl">🐣</span>
            </div>
            <div className="min-w-0">
              <p className="label-poster text-swiss-sage leading-none">Overclock Workshop</p>
              <h1 className="text-lg font-black uppercase tracking-wide text-swiss-ink leading-none mt-0.5 truncate">
                {agentName}
                {agentName !== DEFAULT_NAME && (
                  <span className="ml-2 text-[10px] font-bold text-neutral-400 tracking-wider">via BabyAgent</span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeBadge mode={mode} onClick={() => setModeInfoOpen(true)} />
            <NavToggle
              active={journeyOpen}
              onClick={() => setJourneyOpen(!journeyOpen)}
              icon={<Compass className="w-3.5 h-3.5" />}
              label="Journey"
            />
            <SettingsDialog />
            <button
              onClick={handleRestart}
              title="Restart BabyAgent from blank slate"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-swiss-crimson hover:text-white hover:bg-swiss-crimson border-2 border-swiss-crimson px-3 py-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-swiss-ink border-2 border-transparent hover:border-swiss-ink px-3 py-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Panes — collapsed rails always pinned to the far left (VS Code activity-bar style),
          then expanded panels, then chat fills the rest. */}
      <div className="flex-1 flex min-h-0">
        {!treeOpen && (
          <CollapsedRail
            label="File System"
            accent="orange"
            icon={<FolderTree className="w-4 h-4" />}
            onExpand={() => setTreeOpen(true)}
          />
        )}
        {!editorOpen && (
          <CollapsedRail
            label="Editor"
            accent="blue"
            icon={<FileCode2 className="w-4 h-4" />}
            onExpand={() => setEditorOpen(true)}
          />
        )}

        {treeOpen && (
          <div className="basis-[260px] shrink-0 min-h-0 flex flex-col">
            <FileTree
              selected={selected}
              onSelect={setSelected}
              onOpen={handleOpenFile}
              onCollapse={() => setTreeOpen(false)}
            />
          </div>
        )}

        {editorOpen && (
          <div className="basis-[520px] flex-1 min-w-0 min-h-0 flex flex-col">
            <Editor path={selected} onCollapse={() => setEditorOpen(false)} />
          </div>
        )}

        <div className={`min-h-0 flex flex-col min-w-0 ${
          editorOpen ? 'basis-[460px] shrink-0' : 'flex-1'
        }`}>
          <Chat greeting={FIRST_GREETING} />
        </div>
      </div>

      <JourneyDialog open={journeyOpen} onClose={() => setJourneyOpen(false)} />
      <ModeInfoDialog open={modeInfoOpen} mode={mode} onClose={() => setModeInfoOpen(false)} />
    </div>
  )
}

function ModeInfoDialog({
  open, mode, onClose,
}: { open: boolean; mode: 'local' | 'hosted' | 'unknown'; onClose: () => void }) {
  if (!open) return null
  const isLocal = mode === 'local'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white border-2 border-swiss-ink shadow-[8px_8px_0_0_rgba(12,12,12,0.25)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-stretch border-b-2 border-swiss-ink">
          <div className={`w-2 ${isLocal ? 'bg-green-700' : 'bg-neutral-400'}`} aria-hidden />
          <div className="flex flex-1 items-center justify-between px-4 py-3">
            <div>
              <p className="label-poster text-swiss-sage">Runtime mode</p>
              <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink">
                {isLocal ? 'Local · Proxy On' : 'Hosted · Browser Only'}
              </p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-swiss-beige/40 text-neutral-600">
              ✕
            </button>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4 text-sm leading-relaxed text-swiss-ink">
          {isLocal ? (
            <>
              <p>
                You&rsquo;re running BabyAgent <strong>locally on your laptop</strong> via <code className="text-xs bg-swiss-beige/40 px-1.5 py-0.5">bun dev</code>. That means your laptop is the server &mdash; not Vercel, not anyone else.
              </p>
              <p>
                Because you control the server, BabyAgent can use a built-in <strong>proxy route</strong> at <code className="text-xs bg-swiss-beige/40 px-1.5 py-0.5">/api/proxy</code>. When BabyAgent creates a custom skill that targets an API which blocks browser-direct requests &mdash; Notion, Resend, SendGrid, Linear, the Slack Web API, Twilio, most enterprise SaaS &mdash; the request is routed through your local Node process instead of fired straight from your browser. The browser&rsquo;s CORS rules don&rsquo;t apply to server-side fetches, so things just work.
              </p>
              <p>
                <strong>Privacy is the same or better:</strong> your secrets go from your browser, to your laptop&rsquo;s Next.js process, to the target API. They never touch Vercel or any third party.
              </p>
              <p className="text-xs text-neutral-500 italic">
                When BabyAgent builds a new skill, it knows to set <code>proxy: true</code> in the spec for any API that needs it.
              </p>
            </>
          ) : (
            <>
              <p>
                You&rsquo;re running BabyAgent in <strong>hosted mode</strong> &mdash; the deployed Vercel version. The proxy is deliberately disabled here so the privacy story stays honest: <em>your keys never leave your browser.</em>
              </p>
              <p>
                That means BabyAgent can only call APIs that are <strong>browser-friendly</strong> (CORS-allowed): GitHub public, Discord webhooks, ntfy.sh, webhook.site, Tavily, OpenWeather, the Telegram bot API, and so on. These work great for live demos.
              </p>
              <p>
                Skills that need a proxy &mdash; real email (Resend/SendGrid), Notion, Linear, the Slack Web API &mdash; will return a friendly error telling you to clone and run locally.
              </p>
              <div className="border-2 border-swiss-ink bg-swiss-beige/30 p-3 mt-3">
                <p className="label-poster text-swiss-sage mb-1">To unlock proxy mode</p>
                <pre className="text-[11px] font-mono leading-relaxed text-swiss-ink whitespace-pre-wrap">{`gh repo clone Overclock-Accelerator/babyagent
cd babyagent
bun install
bun dev`}</pre>
                <p className="text-[11px] text-neutral-600 mt-2">
                  Open <code>http://localhost:3000</code>, log in with the same workshop password, and the badge will turn green.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t-2 border-swiss-ink bg-swiss-beige/30">
          <button
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider bg-swiss-orange hover:bg-[#cf5204] text-white border-2 border-swiss-ink px-3 py-2 shadow-[2px_2px_0_0_rgba(12,12,12,1)] hover:shadow-[1px_1px_0_0_rgba(12,12,12,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeBadge({ mode, onClick }: { mode: 'local' | 'hosted' | 'unknown'; onClick: () => void }) {
  if (mode === 'unknown') return null
  const isLocal = mode === 'local'
  return (
    <button
      onClick={onClick}
      title="What does this mean?"
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-2 px-3 py-2 transition-colors ${
        isLocal
          ? 'bg-green-50 text-green-800 border-green-700 hover:bg-green-100'
          : 'bg-neutral-100 text-neutral-600 border-neutral-400 hover:bg-neutral-200'
      }`}
    >
      {isLocal ? <Server className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
      {isLocal ? 'Local · Proxy On' : 'Hosted'}
    </button>
  )
}

function NavToggle({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={`${active ? 'Hide' : 'Show'} ${label}`}
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-2 px-3 py-2 transition-all ${
        active
          ? 'bg-swiss-ink text-white border-swiss-ink'
          : 'bg-white text-swiss-ink border-swiss-ink hover:bg-swiss-beige/40'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
