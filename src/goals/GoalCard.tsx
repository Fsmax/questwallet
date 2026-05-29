import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, Pencil, CheckCircle2 } from 'lucide-react'
import type { Goal, Currency } from '../types'
import { formatMoney, formatMoneyShort, formatPercent } from '../lib/format'

interface GoalCardProps {
  goal: Goal
  currency: Currency
  walletBalance: number
  onSave: () => void
  onWithdraw: () => void
  onEdit: () => void
}

export function GoalCard({ goal, currency, walletBalance, onSave, onWithdraw, onEdit }: GoalCardProps) {
  const ratio = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0
  const done = goal.completedAt !== null
  const canSave = walletBalance > 0 && !done
  const canWithdraw = goal.saved > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`relative rounded-2xl border p-4 transition ${
        done
          ? 'bg-[var(--color-gold)]/8 border-[var(--color-gold)]/40'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${
            done ? 'bg-[var(--color-gold)]/15' : 'bg-white/5'
          }`}
        >
          {goal.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-[family-name:var(--font-display)] font-bold text-white text-lg truncate flex-1">
              {goal.title}
            </div>
            <button
              onClick={onEdit}
              className="p-1.5 -mr-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition flex-shrink-0"
              aria-label="Редактировать"
            >
              <Pencil size={16} />
            </button>
          </div>

          {done ? (
            <div className="flex items-center gap-1 mt-0.5 text-sm text-[var(--color-gold)] font-bold">
              <CheckCircle2 size={14} />
              Цель достигнута
            </div>
          ) : (
            <div className="text-sm text-white/60 tabular-nums mt-0.5">
              {formatMoneyShort(goal.saved, currency)} из {formatMoneyShort(goal.target, currency)}
              <span className="text-[var(--color-gold)] ml-2 font-bold">{formatPercent(ratio)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-emerald-quest)]"
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {!done && (
        <div className="mt-3 text-xs text-white/40 tabular-nums">
          Осталось: <strong className="text-white/70">{formatMoney(Math.max(0, goal.target - goal.saved), currency)}</strong>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={onSave}
          disabled={!canSave}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)] font-bold hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
        >
          <ArrowDownToLine size={16} />
          Отложить
        </button>
        <button
          onClick={onWithdraw}
          disabled={!canWithdraw}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 font-bold hover:bg-white/10 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
        >
          <ArrowUpFromLine size={16} />
          Снять
        </button>
      </div>
    </motion.div>
  )
}
