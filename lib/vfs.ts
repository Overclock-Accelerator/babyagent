'use client'

// Virtual filesystem persisted in localStorage. Files are flat path -> contents.
// Folders are implied from "/" in paths (e.g. "skills/web_fetch.md").

const KEY = 'babyagent_vfs_v1'

export type VFS = Record<string, string>

export function loadVFS(): VFS {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function saveVFS(vfs: VFS): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(vfs))
  window.dispatchEvent(new CustomEvent('babyagent-vfs-changed'))
}

export function writeFile(path: string, contents: string): VFS {
  const vfs = loadVFS()
  vfs[path] = contents
  saveVFS(vfs)
  return vfs
}

export function readFile(path: string): string | undefined {
  return loadVFS()[path]
}

export function deleteFile(path: string): VFS {
  const vfs = loadVFS()
  delete vfs[path]
  saveVFS(vfs)
  return vfs
}

export function listFiles(): string[] {
  return Object.keys(loadVFS()).sort()
}

export function resetVFS(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent('babyagent-vfs-changed'))
}

// Build a tree structure from flat paths for FileTree rendering.
export type TreeNode = {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
}

export function buildTree(vfs: VFS): TreeNode {
  const root: TreeNode = { name: '/', path: '', isDir: true, children: [] }
  const dirs = new Map<string, TreeNode>()
  dirs.set('', root)

  const paths = Object.keys(vfs).sort()
  for (const path of paths) {
    const segments = path.split('/')
    let parentPath = ''
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const isLast = i === segments.length - 1
      const fullPath = parentPath ? `${parentPath}/${seg}` : seg
      if (isLast) {
        const parent = dirs.get(parentPath)!
        parent.children.push({ name: seg, path: fullPath, isDir: false, children: [] })
      } else {
        if (!dirs.has(fullPath)) {
          const dirNode: TreeNode = { name: seg, path: fullPath, isDir: true, children: [] }
          dirs.set(fullPath, dirNode)
          dirs.get(parentPath)!.children.push(dirNode)
        }
        parentPath = fullPath
      }
    }
  }
  // sort: dirs first, then files, alpha
  const sortNode = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    n.children.forEach(sortNode)
  }
  sortNode(root)
  return root
}
