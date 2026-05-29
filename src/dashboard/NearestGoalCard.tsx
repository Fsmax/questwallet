import type { Goal, Currency } from '../types'
import { formatMoneyShort, formatPercent } from '../lib/format'

interface NearestGoalCardProps {
  goal: Goal | null
  currency: Currency
}

export function NearestGoalCard({ goal, currency }: NearestGoalCardProps) {
  if (!goal) {
    return (
      <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-center text-white/50 text-sm">
        Целей пока нет — добавь первую во вкладке «Цели» 🎯
      </div>
    )
  }

  const ratio = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0

  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{goal.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">
            Ближайшая цель
          </div>
          <div className="font-[family-name:var(--font-display)] text-lg font-bold text-white truncate">
            {goal.title}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[var(--color-gold)] tabular-nums">
            {formatPercent(ratio)}
          </div>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-emerald-quest)] transition-all duration-500"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/50 tabular-nums">
        <span>{formatMoneyShort(goal.saved, currency)}</span>
        <span>{formatMoneyShort(goal.target, currency)}</span>
      </div>
    </div>
  )
}
