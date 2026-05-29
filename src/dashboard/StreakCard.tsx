import { Flame } from 'lucide-react'

interface StreakCardProps {
  streak: number
}

export function StreakCard({ streak }: StreakCardProps) {
  const isActive = streak > 0
  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10 flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isActive
            ? 'bg-[var(--color-coral)]/20 text-[var(--color-coral)]'
            : 'bg-white/5 text-white/30'
        }`}
      >
        <Flame size={24} fill={isActive ? 'currentColor' : 'none'} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">
          Серия дней
        </div>
        <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-white tabular-nums">
          {streak}
        </div>
      </div>
    </div>
  )
}
