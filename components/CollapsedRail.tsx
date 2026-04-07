'use client'

import { ChevronsRight } from 'lucide-react'

interface Props {
  label: string
  accent: 'orange' | 'blue' | 'sage'
  icon: React.ReactNode
  onExpand: () => void
}

const ACCENT_BG: Record<Props['accent'], string> = {
  orange: 'bg-swiss-orange',
  blue: 'bg-swiss-blue',
  sage: 'bg-swiss-sage',
}

export default function CollapsedRail({ label, accent, icon, onExpand }: Props) {
  return (
    <div className="basis-[44px] shrink-0 min-h-0 flex flex-col">
      <div className="flex flex-col h-full min-h-0 bg-white border-2 border-swiss-ink m-2 sm:m-3 shadow-[6px_6px_0_0_rgba(12,12,12,0.12)]">
        {/* Accent stripe at the top to match expanded panels */}
        <div className={`h-2 ${ACCENT_BG[accent]} border-b-2 border-swiss-ink shrink-0`} aria-hidden />

        {/* Expand button */}
        <button
          onClick={onExpand}
          title={`Expand ${label}`}
          className="shrink-0 flex items-center justify-center py-2 border-b-2 border-swiss-ink hover:bg-swiss-beige/40 transition-colors"
        >
          <ChevronsRight className="w-4 h-4 text-swiss-ink" />
        </button>

        {/* Vertical label */}
        <button
          onClick={onExpand}
          className="flex-1 flex flex-col items-center justify-center gap-3 py-4 hover:bg-swiss-beige/30 transition-colors min-h-0"
          title={`Expand ${label}`}
        >
          <div className="text-swiss-orange">{icon}</div>
          <p
            className="label-poster text-swiss-ink"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {label}
          </p>
        </button>
      </div>
    </div>
  )
}
