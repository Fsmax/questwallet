import { Swords } from 'lucide-react'

interface DayProgressProps {
  done: number
  total: number
}

export function DayProgress({ done, total }: DayProgressProps) {
  const ratio = total > 0 ? done / total : 0
  const allDone = total > 0 && done === total

  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/70 font-semibold text-sm">
          <Swords size={16} className="text-[var(--color-emerald-quest)]" />
          Квесты на сегодня
        </div>
        <div className="text-sm tabular-nums">
          <span className={allDone ? 'text-[var(--color-emerald-quest)] font-bold' : 'text-white'}>
            {done}
          </span>
          <span className="text-white/40"> / {total}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-emerald-quest)] to-[var(--color-gold)] transition-all duration-500"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {allDone && (
        <div className="mt-2 text-xs text-[var(--color-emerald-quest)] font-semibold">
          ✨ Все квесты дня закрыты
        </div>
      )}
    </div>
  )
}
