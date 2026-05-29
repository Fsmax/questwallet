import { motion } from 'framer-motion'
import { Check, RotateCcw, Pencil, Clock } from 'lucide-react'
import type { Currency, WorkTask } from '../types'
import { formatMoney } from '../lib/format'
import { feedbackComplete } from '../lib/feedback'

interface WorkTaskRowProps {
  task: WorkTask
  currency: Currency
  onComplete: () => void
  onUncomplete: () => void
  onEdit?: () => void
}

export function WorkTaskRow({ task, currency, onComplete, onUncomplete, onEdit }: WorkTaskRowProps) {
  const handleComplete = () => {
    feedbackComplete()
    onComplete()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`relative rounded-xl border p-2.5 transition ${
        task.doneToday
          ? 'bg-[var(--color-emerald-quest)]/8 border-[var(--color-emerald-quest)]/30'
          : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="text-xl flex-shrink-0 w-7 text-center">{task.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${task.doneToday ? 'text-white/50 line-through' : 'text-white font-semibold'}`}>
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-bold text-[var(--color-emerald-quest)] tabular-nums">
              +{formatMoney(task.amount, currency)}
            </span>
            {task.time && (
              <span className="flex items-center gap-1 text-[10px] text-white/50 tabular-nums">
                <Clock size={11} />
                {task.time}
              </span>
            )}
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-white/55 hover:text-white/80 hover:bg-white/5 transition flex-shrink-0"
            aria-label="Редактировать"
          >
            <Pencil size={14} />
          </button>
        )}
        {task.doneToday ? (
          <button
            onClick={onUncomplete}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition flex-shrink-0"
            aria-label="Снять отметку"
          >
            <RotateCcw size={16} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-9 h-9 rounded-lg bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)] flex items-center justify-center hover:brightness-110 active:scale-95 transition flex-shrink-0"
            aria-label="Выполнить и получить деньги"
          >
            <Check size={18} strokeWidth={3} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
