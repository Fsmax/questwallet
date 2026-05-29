import { motion } from 'framer-motion'
import { Pencil, CalendarClock, Check } from 'lucide-react'
import type { Currency, Debt } from '../types'
import { formatMoney } from '../lib/format'
import { debtRemaining } from '../finance/debts'

interface DebtCardProps {
  debt: Debt
  currency: Currency
  onRepay: () => void
  onEdit: () => void
}

function formatDue(due: string): string {
  const [y, m, d] = due.split('-')
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] ?? m} ${y}`
}

export function DebtCard({ debt, currency, onRepay, onEdit }: DebtCardProps) {
  const remaining = debtRemaining(debt)
  const settled = remaining <= 0
  const progress = debt.principal > 0 ? Math.min(1, debt.paid / debt.principal) : 0
  const isOwedToMe = debt.direction === 'owed_to_me'
  const accent = isOwedToMe ? 'var(--color-emerald-quest)' : 'var(--color-coral)'

  const today = new Date().toISOString().slice(0, 10)
  const overdue = !settled && debt.dueDate !== null && debt.dueDate < today

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl p-4 border ${
        settled ? 'bg-white/[0.02] border-white/5 opacity-70' : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}
        >
          {debt.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-white font-bold truncate">{debt.person}</div>
            <button
              onClick={onEdit}
              className="text-white/40 hover:text-white transition flex-shrink-0"
              aria-label="Редактировать"
            >
              <Pencil size={15} />
            </button>
          </div>
          {debt.note && <div className="text-xs text-white/50 truncate">{debt.note}</div>}

          <div className="flex items-baseline gap-2 mt-1.5">
            {settled ? (
              <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-emerald-quest)]">
                <Check size={14} /> Погашено
              </span>
            ) : (
              <>
                <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
                  {formatMoney(remaining, currency)}
                </span>
                {debt.paid > 0 && (
                  <span className="text-xs text-white/40 tabular-nums">
                    из {formatMoney(debt.principal, currency)}
                  </span>
                )}
              </>
            )}
          </div>

          {!settled && debt.paid > 0 && (
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
              <div
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, background: accent }}
              />
            </div>
          )}

          {debt.dueDate && !settled && (
            <div
              className={`flex items-center gap-1 text-xs mt-2 ${
                overdue ? 'text-[var(--color-coral)]' : 'text-white/40'
              }`}
            >
              <CalendarClock size={13} />
              {overdue ? 'Просрочено: ' : 'Срок: '}
              {formatDue(debt.dueDate)}
            </div>
          )}
        </div>
      </div>

      {!settled && (
        <button
          onClick={onRepay}
          className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm text-[var(--color-bg-deep)] hover:brightness-110 active:scale-[0.98] transition"
          style={{ background: accent }}
        >
          {isOwedToMe ? 'Вернули' : 'Отдать'}
        </button>
      )}
    </motion.div>
  )
}
