import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, RotateCcw, Pencil } from 'lucide-react'
import type { SkillTask } from '../types'
import { feedbackComplete } from '../lib/feedback'
import { FloatingReward } from '../quests/FloatingReward'

interface SkillTaskRowProps {
  task: SkillTask
  onComplete: () => void
  onCancel: () => void
  onEdit: () => void
}

export function SkillTaskRow({ task, onComplete, onCancel, onEdit }: SkillTaskRowProps) {
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
      className={`relative rounded-xl border p-2.5 transition ${
        task.doneToday
          ? 'bg-[var(--color-emerald-quest)]/8 border-[var(--color-emerald-quest)]/30'
          : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <FloatingReward show={floating} text={`+${task.xpReward} баллов`} />
      <div className="flex items-center gap-2.5">
        <div className="text-xl flex-shrink-0 w-7 text-center">{task.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${task.doneToday ? 'text-white/50 line-through' : 'text-white font-semibold'}`}>
            {task.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)] font-bold tabular-nums">
              +{task.xpReward} баллов
            </span>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-white/55 hover:text-white/80 hover:bg-white/5 transition flex-shrink-0"
          aria-label="Редактировать"
        >
          <Pencil size={14} />
        </button>
        {task.doneToday ? (
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition flex-shrink-0"
            aria-label="Отменить"
          >
            <RotateCcw size={16} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-9 h-9 rounded-lg bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)] flex items-center justify-center hover:brightness-110 active:scale-95 transition flex-shrink-0"
            aria-label="Выполнить"
          >
            <Check size={18} strokeWidth={3} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
