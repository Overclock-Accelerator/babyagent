'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Wrench } from 'lucide-react'
import { runTurn, type ChatMessage } from '@/lib/anthropic'
import { useAgentName, getAgentName } from '@/lib/agentName'
import { loadVFS } from '@/lib/vfs'
import { buildGreeting } from '@/lib/seed'

const STORAGE = 'babyagent_chat_v1'

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(h: ChatMessage[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE, JSON.stringify(h))
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const agentName = useAgentName()

  useEffect(() => {
    const h = loadHistory()
    if (h.length === 0) {
      const seeded: ChatMessage = { id: 'seed', role: 'assistant', content: buildGreeting(loadVFS(), getAgentName()) }
      setMessages([seeded])
      saveHistory([seeded])
    } else {
      setMessages(h)
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { id: Math.random().toString(36).slice(2), role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    saveHistory(next)
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setLoading(true)
    setProgress('')
    try {
      const reply = await runTurn(messages, trimmed, { onProgress: setProgress })
      const finalNext = [...next, reply]
      setMessages(finalNext)
      saveHistory(finalNext)
    } catch (err) {
      const errMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
      }
      const finalNext = [...next, errMsg]
      setMessages(finalNext)
      saveHistory(finalNext)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClear() {
    if (window.confirm('Clear the conversation? File state stays. This only wipes chat history.')) {
      const seeded: ChatMessage = { id: 'seed', role: 'assistant', content: buildGreeting(loadVFS(), getAgentName()) }
      setMessages([seeded])
      saveHistory([seeded])
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border-2 border-swiss-ink m-2 sm:m-3 shadow-[6px_6px_0_0_rgba(12,12,12,0.12)]">
      <div className="flex items-stretch border-b-2 border-swiss-ink shrink-0">
        <div className="w-2 bg-swiss-orange shrink-0" aria-hidden />
        <div className="flex flex-1 items-center justify-between px-4 py-3 min-w-0">
          <div className="min-w-0">
            <p className="label-poster text-swiss-sage">Live chat</p>
            <p className="text-sm font-bold uppercase tracking-wide text-swiss-ink truncate">Talk to {agentName}</p>
          </div>
          <button
            onClick={handleClear}
            className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-swiss-ink border-2 border-transparent hover:border-swiss-ink px-2 py-1.5 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 min-h-0 scrollbar-thin">
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} agentName={agentName} />
        ))}
        {loading && (
          <div className="flex flex-col items-start gap-2">
            <p className="label-poster text-neutral-500 px-1">{agentName}</p>
            <div className="border-2 border-swiss-ink bg-swiss-beige/40 px-4 py-3 flex items-center gap-2">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full bg-swiss-ink ba-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
              {progress && <span className="ml-2 text-xs text-neutral-500 font-mono">{progress}</span>}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex-shrink-0 border-t-2 border-swiss-ink bg-swiss-beige/30 px-3 py-3">
        <div className="flex items-end gap-2 border-2 border-swiss-ink bg-white px-3 py-2">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              const ta = e.target
              ta.style.height = 'auto'
              ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Talk to BabyAgent…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none disabled:opacity-50 overflow-hidden text-swiss-ink placeholder:text-neutral-400 leading-relaxed min-h-[24px] max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-swiss-orange hover:bg-[#cf5204] disabled:opacity-40 disabled:cursor-not-allowed text-white border-2 border-swiss-ink w-9 h-9 flex items-center justify-center flex-shrink-0 transition-colors shadow-[2px_2px_0_0_rgba(12,12,12,1)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

function Bubble({ msg, agentName }: { msg: ChatMessage; agentName: string }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <p className="label-poster text-neutral-500 px-1">{isUser ? 'You' : agentName}</p>
      <div
        className={`max-w-[88%] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed border-2 ${
          isUser
            ? 'bg-swiss-orange text-white border-swiss-ink shadow-[3px_3px_0_0_rgba(12,12,12,0.2)]'
            : 'bg-white text-swiss-ink border-neutral-300'
        }`}
      >
        {msg.content}
      </div>
      {msg.toolCalls && msg.toolCalls.length > 0 && (
        <div className="flex flex-col gap-1.5 max-w-[88%] w-full">
          {msg.toolCalls.map((tc, i) => (
            <details key={i} className="border-2 border-dashed border-swiss-blue/60 bg-sky-50 px-3 py-2 text-[11px] font-mono">
              <summary className="cursor-pointer flex items-center gap-1.5 text-swiss-blue font-bold uppercase tracking-wider">
                <Wrench className="w-3 h-3" /> tool: {tc.name}
              </summary>
              <div className="mt-2 text-neutral-700 space-y-1.5">
                <div><span className="text-swiss-sage font-bold">input:</span> <code className="text-neutral-800">{JSON.stringify(tc.input)}</code></div>
                <div><span className="text-swiss-sage font-bold">output:</span> <code className="text-neutral-800 whitespace-pre-wrap break-all">{tc.output.length > 280 ? tc.output.slice(0, 280) + '…' : tc.output}</code></div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
