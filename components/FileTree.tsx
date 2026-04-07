'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, RefreshCw } from 'lucide-react'
import { buildTree, loadVFS, resetVFS, type TreeNode } from '@/lib/vfs'

interface Props {
  selected: string | null
  onSelect: (path: string) => void
}

export default function FileTree({ selected, onSelect }: Props) {
  const [tree, setTree] = useState<TreeNode>(() => buildTree({}))
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set(['', 'skills']))

  useEffect(() => {
    function refresh() { setTree(buildTree(loadVFS())) }
    refresh()
    window.addEventListener('babyagent-vfs-changed', refresh)
    return () => window.removeEventListener('babyagent-vfs-changed', refresh)
  }, [])

  function toggleDir(path: string) {
    const next = new Set(openDirs)
    if (next.has(path)) next.delete(path); else next.add(path)
    setOpenDirs(next)
  }

  function handleReset() {
    if (window.confirm('Reset BabyAgent to a blank slate? This wipes all files and starts over.')) {
      resetVFS()
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border-2 border-swiss-ink m-2 sm:m-3 shadow-[6px_6px_0_0_rgba(12,12,12,0.12)]">
      <div className="flex items-stretch border-b-2 border-swiss-ink shrink-0">
        <div className="w-2 bg-swiss-orange shrink-0" aria-hidden />
        <div className="flex flex-1 items-center justify-between px-4 py-3 min-w-0">
          <div>
            <p className="label-poster text-swiss-sage">Filesystem</p>
            <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink">BabyAgent&rsquo;s Soul</p>
          </div>
          <button
            onClick={handleReset}
            title="Reset BabyAgent to blank slate"
            className="text-neutral-500 hover:text-swiss-crimson border-2 border-transparent hover:border-swiss-ink p-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3 min-h-0 scrollbar-thin font-mono text-[13px]">
        {tree.children.length === 0 ? (
          <p className="text-xs text-neutral-400 italic px-2">empty</p>
        ) : (
          <TreeNodeView
            nodes={tree.children}
            depth={0}
            openDirs={openDirs}
            toggleDir={toggleDir}
            selected={selected}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  )
}

function TreeNodeView({
  nodes,
  depth,
  openDirs,
  toggleDir,
  selected,
  onSelect,
}: {
  nodes: TreeNode[]
  depth: number
  openDirs: Set<string>
  toggleDir: (p: string) => void
  selected: string | null
  onSelect: (p: string) => void
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        if (node.isDir) {
          const isOpen = openDirs.has(node.path)
          return (
            <li key={node.path}>
              <button
                onClick={() => toggleDir(node.path)}
                className="w-full text-left flex items-center gap-1 py-1 px-1 hover:bg-swiss-beige/40 rounded-sm"
                style={{ paddingLeft: depth * 12 + 4 }}
              >
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
                {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-swiss-orange" /> : <Folder className="w-3.5 h-3.5 text-swiss-orange" />}
                <span className="text-swiss-ink font-semibold">{node.name}/</span>
              </button>
              {isOpen && node.children.length > 0 && (
                <TreeNodeView
                  nodes={node.children}
                  depth={depth + 1}
                  openDirs={openDirs}
                  toggleDir={toggleDir}
                  selected={selected}
                  onSelect={onSelect}
                />
              )}
            </li>
          )
        }
        const isSelected = selected === node.path
        return (
          <li key={node.path}>
            <button
              onClick={() => onSelect(node.path)}
              className={`w-full text-left flex items-center gap-1.5 py-1 px-1 rounded-sm ${
                isSelected ? 'bg-swiss-orange/15 border-l-2 border-swiss-orange' : 'hover:bg-swiss-beige/40 border-l-2 border-transparent'
              }`}
              style={{ paddingLeft: depth * 12 + 18 }}
            >
              <FileText className="w-3.5 h-3.5 text-swiss-blue shrink-0" />
              <span className={`truncate ${isSelected ? 'text-swiss-ink font-bold' : 'text-neutral-700'}`}>{node.name}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
