import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, RotateCcw, Pencil } from 'lucide-react'
import type { Task } from '../types'
import { feedbackComplete } from '../lib/feedback'
import { FloatingReward } from './FloatingReward'

interface QuestCardProps {
  task: Task
  onComplete: () => void
  onCancel: () => void
  onEdit: () => void
}

export function QuestCard({ task, onComplete, onCancel, onEdit }: QuestCardProps) {
  const [floating, setFloating] = useState(false)

  const handleComplete = () => {
    setFloating(true)
    feedbackComplete()
    setTimeout(() => setFloating(false), 900)
    onComplete()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`relative rounded-2xl border p-4 transition ${
        task.doneToday
          ? 'bg-[var(--color-emerald-quest)]/8 border-[var(--color-emerald-quest)]/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <FloatingReward show={floating} text={`+${task.xpReward} баллов`} />

      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition ${
            task.doneToday ? 'bg-[var(--color-emerald-quest)]/15' : 'bg-white/5'
          }`}
        >
          {task.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`font-bold truncate ${
              task.doneToday ? 'text-white/60 line-through' : 'text-white'
            }`}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)] font-bold tabular-nums">
              +{task.xpReward} баллов
            </span>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-white/55 hover:text-white/80 hover:bg-white/5 transition flex-shrink-0"
          aria-label="Редактировать"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className="mt-3">
        {task.doneToday ? (
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 hover:text-white/80 transition"
          >
            <RotateCcw size={14} />
            Отменить
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)] font-bold hover:brightness-110 active:scale-[0.98] transition"
          >
            <Check size={18} strokeWidth={3} />
            Выполнить
          </button>
        )}
      </div>
    </motion.div>
  )
}
