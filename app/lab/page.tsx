'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FileTree from '@/components/FileTree'
import Editor from '@/components/Editor'
import Chat from '@/components/Chat'
import JourneyPanel from '@/components/JourneyPanel'
import SettingsDialog from '@/components/SettingsDialog'
import { LogOut } from 'lucide-react'
import { loadVFS, saveVFS } from '@/lib/vfs'
import { SEED_FILES, FIRST_GREETING } from '@/lib/seed'

export default function LabPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [selected, setSelected] = useState<string | null>('CLAUDE.md')

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
    }
    setAuthed(true)
  }, [router])

  function handleLogout() {
    localStorage.removeItem('babyagent_auth')
    router.push('/')
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

      {/* Three panes */}
      <div className="flex-1 grid grid-cols-12 min-h-0">
        <div className="col-span-3 min-h-0 flex flex-col">
          <FileTree selected={selected} onSelect={setSelected} />
        </div>
        <div className="col-span-5 min-h-0 flex flex-col">
          <Editor path={selected} />
        </div>
        <div className="col-span-4 min-h-0 grid grid-rows-[3fr_2fr]">
          <div className="min-h-0 flex flex-col">
            <Chat greeting={FIRST_GREETING} />
          </div>
          <div className="min-h-0 flex flex-col">
            <JourneyPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
