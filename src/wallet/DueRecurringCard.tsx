import { Repeat } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { dueRecurring } from '../finance/expenses'
import { formatMoney } from '../lib/format'

export function DueRecurringCard() {
  const { state, chargeRecurring } = useAppState()
  if (!state) return null

  const due = dueRecurring(state, new Date())
  if (due.length === 0) return null

  return (
    <div className="rounded-2xl p-4 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30">
      <div className="flex items-center gap-2 mb-2.5">
        <Repeat size={16} className="text-[var(--color-gold)]" />
        <h3 className="text-sm font-bold text-white">Пора отметить в этом месяце</h3>
      </div>
      <div className="space-y-1.5">
        {due.map((r) => {
          const income = r.kind === 'income'
          const notEnough = !income && r.amount > state.balance
          return (
            <div key={r.id} className="flex items-center gap-3">
              <span className="text-xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm truncate">{r.title}</div>
                <div className="text-xs text-white/55 tabular-nums">
                  {income ? '+' : '−'}
                  {formatMoney(r.amount, state.currency)} · {r.dayOfMonth}-го
                </div>
              </div>
              <button
                onClick={() => chargeRecurring(r.id)}
                disabled={notEnough}
                title={notEnough ? 'Недостаточно денег в кошельке' : undefined}
                className={`px-3 py-1.5 font-bold text-xs rounded-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition ${
                  income
                    ? 'bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)]'
                    : 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]'
                }`}
              >
                {income ? 'Зачислить' : 'Записать'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
