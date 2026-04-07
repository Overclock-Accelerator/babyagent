'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FileTree from '@/components/FileTree'
import Editor from '@/components/Editor'
import Chat from '@/components/Chat'
import JourneyDialog from '@/components/JourneyPanel'
import SettingsDialog from '@/components/SettingsDialog'
import { LogOut, FolderTree, FileCode2, Compass } from 'lucide-react'
import { loadVFS, saveVFS } from '@/lib/vfs'
import { SEED_FILES, FIRST_GREETING } from '@/lib/seed'

export default function LabPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [selected, setSelected] = useState<string | null>('CLAUDE.md')
  const [treeOpen, setTreeOpen] = useState(true)
  const [editorOpen, setEditorOpen] = useState(true)
  const [journeyOpen, setJourneyOpen] = useState(false)

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
            <div>
              <p className="label-poster text-swiss-sage leading-none">Overclock Workshop</p>
              <h1 className="text-lg font-black uppercase tracking-wide text-swiss-ink leading-none mt-0.5">BabyAgent</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NavToggle
              active={treeOpen}
              onClick={() => setTreeOpen(!treeOpen)}
              icon={<FolderTree className="w-3.5 h-3.5" />}
              label="Files"
            />
            <NavToggle
              active={editorOpen}
              onClick={() => setEditorOpen(!editorOpen)}
              icon={<FileCode2 className="w-3.5 h-3.5" />}
              label="Editor"
            />
            <NavToggle
              active={journeyOpen}
              onClick={() => setJourneyOpen(!journeyOpen)}
              icon={<Compass className="w-3.5 h-3.5" />}
              label="Journey"
            />
            <SettingsDialog />
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

      {/* Panes — collapsible. Chat always fills remaining width. */}
      <div className="flex-1 flex min-h-0">
        {treeOpen && (
          <div className="basis-[260px] shrink-0 min-h-0 flex flex-col">
            <FileTree selected={selected} onSelect={setSelected} onOpen={handleOpenFile} />
          </div>
        )}
        {editorOpen && (
          <div className="basis-[520px] flex-1 min-w-0 min-h-0 flex flex-col">
            <Editor path={selected} />
          </div>
        )}
        <div className={`min-h-0 flex flex-col min-w-0 ${
          editorOpen ? 'basis-[460px] shrink-0' : 'flex-1'
        }`}>
          <Chat greeting={FIRST_GREETING} />
        </div>
      </div>

      <JourneyDialog open={journeyOpen} onClose={() => setJourneyOpen(false)} />
    </div>
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
