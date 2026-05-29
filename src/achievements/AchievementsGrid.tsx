import { Lock } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { computeAchievements } from './compute'

export function AchievementsGrid() {
  const { state } = useAppState()
  if (!state) return null

  const views = computeAchievements(state)
  const unlockedCount = views.filter((v) => v.unlocked || v.conditionMet).length

  // Сортировка: разблокированные сверху, затем по близости к выполнению
  const sorted = [...views].sort((a, b) => {
    const aDone = a.unlocked || a.conditionMet
    const bDone = b.unlocked || b.conditionMet
    if (aDone !== bDone) return aDone ? -1 : 1
    return b.progress - a.progress
  })

  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wide text-white/40 font-bold">Достижения</h2>
        <span className="text-sm font-bold text-[var(--color-gold)] tabular-nums">
          {unlockedCount} / {views.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
        {sorted.map((v) => {
          const done = v.unlocked || v.conditionMet
          return (
            <div
              key={v.def.id}
              title={`${v.def.title} — ${v.def.desc}`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 p-1 border transition ${
                done
                  ? 'bg-[var(--color-gold)]/12 border-[var(--color-gold)]/40'
                  : 'bg-black/20 border-white/5'
              }`}
            >
              <div className={`text-2xl ${done ? '' : 'grayscale opacity-30'}`}>
                {done ? v.def.emoji : <Lock size={18} className="text-white/30" />}
              </div>
              <div
                className={`text-[9px] leading-tight text-center font-semibold line-clamp-2 ${
                  done ? 'text-white/80' : 'text-white/30'
                }`}
              >
                {v.def.title}
              </div>
              {!done && v.progress > 0 && (
                <div className="w-full h-0.5 rounded-full bg-white/10 overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-[var(--color-gold)]/60"
                    style={{ width: `${v.progress * 100}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
