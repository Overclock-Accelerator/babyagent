'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('babyagent_auth') === 'true') {
      router.push('/lab')
    }
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (password === 'BabyShark101') {
        localStorage.setItem('babyagent_auth', 'true')
        router.push('/lab')
      } else {
        setError('Wrong password. BabyAgent is sad.')
        setLoading(false)
      }
    }, 300)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f4f3ef] p-6 bg-swiss-dots">
      <div className="w-full max-w-sm flex flex-col items-center">

        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 border-2 border-swiss-ink bg-white flex items-center justify-center mb-4 shadow-[6px_6px_0_0_rgba(12,12,12,0.18)]">
            <span className="text-6xl">🐣</span>
          </div>
          <h1 className="text-3xl font-black text-swiss-ink uppercase tracking-[0.1em] text-center leading-tight">
            BabyAgent
          </h1>
          <p className="text-xs text-neutral-500 italic mt-2 text-center leading-snug">
            &ldquo;I don&rsquo;t know anything yet. Will you help me grow up?&rdquo;
          </p>
        </div>

        <div className="w-full bg-white border-2 border-swiss-ink overflow-hidden shadow-[6px_6px_0_0_rgba(12,12,12,0.18)]">
          <div className="bg-swiss-blue px-5 py-3 border-b-2 border-swiss-ink">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/95">Workshop Access</p>
          </div>

          <div className="px-5 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5">
                  Access Code
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full border-2 border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:border-swiss-orange transition-all placeholder:text-neutral-400"
                  placeholder="Enter access code"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-swiss-crimson font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-swiss-orange hover:bg-[#cf5204] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-[0.15em] text-xs py-3 border-2 border-swiss-ink shadow-[3px_3px_0_0_rgba(12,12,12,1)] hover:shadow-[1px_1px_0_0_rgba(12,12,12,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Hatching…' : 'Enter the Lab'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-neutral-400 mt-6">
          &copy; Overclock Accelerator 2026
        </p>
      </div>
    </main>
  )
}
