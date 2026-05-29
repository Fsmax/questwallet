import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Pencil } from 'lucide-react'
import type { Skill, SkillTask } from '../types'
import { calcLevel } from '../finance/game'
import { SkillTaskRow } from './SkillTaskRow'

interface SkillCardProps {
  skill: Skill
  tasks: SkillTask[]
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onAddTask: () => void
  onCompleteTask: (taskId: string) => void
  onCancelTask: (taskId: string) => void
  onEditTask: (task: SkillTask) => void
}

export function SkillCard({
  skill,
  tasks,
  expanded,
  onToggle,
  onEdit,
  onAddTask,
  onCompleteTask,
  onCancelTask,
  onEditTask,
}: SkillCardProps) {
  const [hovered, setHovered] = useState(false)
  const lvl = calcLevel(skill.xp)
  const done = tasks.filter((t) => t.doneToday).length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition"
      >
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
          {skill.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-[family-name:var(--font-display)] font-bold text-white truncate">
              {skill.title}
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)] font-bold flex-shrink-0">
              LV {lvl.level}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-emerald-quest)] transition-all"
                style={{ width: `${lvl.progress * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 tabular-nums">
              {lvl.rem}/{lvl.need}
            </span>
          </div>
          {tasks.length > 0 && (
            <div className="text-xs text-white/50 mt-1">
              {done} / {tasks.length} выполнено сегодня
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {(hovered || expanded) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
              aria-label="Редактировать навык"
            >
              <Pencil size={16} />
            </button>
          )}
          <ChevronDown
            size={20}
            className={`text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-4 text-sm text-white/40">
                  Заданий в навыке пока нет
                </div>
              ) : (
                tasks.map((t) => (
                  <SkillTaskRow
                    key={t.id}
                    task={t}
                    onComplete={() => onCompleteTask(t.id)}
                    onCancel={() => onCancelTask(t.id)}
                    onEdit={() => onEditTask(t)}
                  />
                ))
              )}
              <button
                onClick={onAddTask}
                className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 bg-white/5 border border-dashed border-white/15 text-white/60 text-sm font-semibold rounded-xl hover:bg-white/10 hover:text-white/90 transition"
              >
                <Plus size={14} />
                Добавить задание
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
