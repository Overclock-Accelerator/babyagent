'use client'

import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { loadVFS, writeFile } from '@/lib/vfs'
import { Save, ChevronsLeft } from 'lucide-react'

interface Props {
  path: string | null
  onCollapse?: () => void
}

export default function Editor({ path, onCollapse }: Props) {
  const [contents, setContents] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!path) { setContents(''); setDirty(false); return }
    const vfs = loadVFS()
    setContents(vfs[path] ?? '')
    setDirty(false)
  }, [path])

  useEffect(() => {
    function refresh() {
      if (!path) return
      const vfs = loadVFS()
      const next = vfs[path] ?? ''
      // Only refresh from external changes if we're not dirty (to avoid clobbering user edits)
      setContents((prev) => (dirty ? prev : next))
    }
    window.addEventListener('babyagent-vfs-changed', refresh)
    return () => window.removeEventListener('babyagent-vfs-changed', refresh)
  }, [path, dirty])

  function handleSave() {
    if (!path) return
    writeFile(path, contents)
    setDirty(false)
  }

  if (!path) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-white border-2 border-swiss-ink m-2 sm:m-3 shadow-[6px_6px_0_0_rgba(12,12,12,0.12)]">
        <div className="flex items-stretch border-b-2 border-swiss-ink shrink-0">
          <div className="w-2 bg-swiss-blue shrink-0" aria-hidden />
          <div className="flex flex-1 items-center justify-between px-4 py-3 gap-2">
            <div className="min-w-0">
              <p className="label-poster text-swiss-sage">Editor</p>
              <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink">No file open</p>
            </div>
            {onCollapse && (
              <button
                onClick={onCollapse}
                title="Collapse editor"
                className="shrink-0 text-neutral-500 hover:text-swiss-ink border-2 border-transparent hover:border-swiss-ink p-1.5 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div className="max-w-md">
            <p className="text-base text-neutral-500 leading-relaxed">
              Click any file in the tree on the left to open it. Files appear here as plain markdown — edit them directly and click <strong className="text-swiss-ink">Save</strong> to update BabyAgent&rsquo;s context for the next turn.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border-2 border-swiss-ink m-2 sm:m-3 shadow-[6px_6px_0_0_rgba(12,12,12,0.12)]">
      <div className="flex items-stretch border-b-2 border-swiss-ink shrink-0">
        <div className="w-2 bg-swiss-blue shrink-0" aria-hidden />
        <div className="flex flex-1 items-center justify-between px-4 py-3 min-w-0 gap-2">
          <div className="min-w-0">
            <p className="label-poster text-swiss-sage">Editor</p>
            <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink truncate font-mono">{path}{dirty && <span className="text-swiss-orange ml-2">●</span>}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-swiss-ink bg-swiss-orange hover:bg-[#cf5204] disabled:opacity-30 disabled:cursor-not-allowed text-white border-2 border-swiss-ink px-3 py-2 shadow-[2px_2px_0_0_rgba(12,12,12,1)] hover:shadow-[1px_1px_0_0_rgba(12,12,12,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            {onCollapse && (
              <button
                onClick={onCollapse}
                title="Collapse editor"
                className="text-neutral-500 hover:text-swiss-ink border-2 border-transparent hover:border-swiss-ink p-1.5 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <CodeMirror
          value={contents}
          height="100%"
          extensions={[markdown(), EditorView.lineWrapping]}
          onChange={(v) => { setContents(v); setDirty(true) }}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
          theme="light"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
