import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { SkillCard } from '../skills/SkillCard'
import { SkillForm, type SkillFormValues } from '../skills/SkillForm'
import { SkillTaskForm, type SkillTaskFormValues } from '../skills/SkillTaskForm'
import { Modal } from '../components/Modal'
import type { Skill, SkillTask } from '../types'

type SkillEditing = { mode: 'new' } | { mode: 'edit'; skill: Skill } | null
type TaskEditing =
  | { mode: 'new'; skillId: string }
  | { mode: 'edit'; task: SkillTask }
  | null

export function SkillsScreen() {
  const {
    state,
    earnSkillTask,
    cancelSkillTask,
    addSkill,
    editSkill,
    deleteSkill,
    addSkillTask,
    editSkillTask,
    deleteSkillTask,
    loadSeedSkills,
  } = useAppState()
  const [skillEditing, setSkillEditing] = useState<SkillEditing>(null)
  const [taskEditing, setTaskEditing] = useState<TaskEditing>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  if (!state) return null

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmitSkill = (values: SkillFormValues) => {
    if (skillEditing?.mode === 'edit') {
      editSkill(skillEditing.skill.id, values)
    } else {
      addSkill(values)
    }
    setSkillEditing(null)
  }

  const handleDeleteSkill = () => {
    if (skillEditing?.mode !== 'edit') return
    const skill = skillEditing.skill
    if (
      confirm(`Удалить навык «${skill.title}»? Все его задания тоже удалятся. Деньги и XP останутся.`)
    ) {
      deleteSkill(skill.id)
      setSkillEditing(null)
    }
  }

  const handleSubmitTask = (values: SkillTaskFormValues) => {
    if (taskEditing?.mode === 'edit') {
      editSkillTask(taskEditing.task.id, values)
    } else if (taskEditing?.mode === 'new') {
      addSkillTask(taskEditing.skillId, values)
    }
    setTaskEditing(null)
  }

  const handleDeleteTask = () => {
    if (taskEditing?.mode !== 'edit') return
    if (confirm('Удалить задание? Деньги и XP за прошлые выполнения останутся.')) {
      deleteSkillTask(taskEditing.task.id)
      setTaskEditing(null)
    }
  }

  const loadExamples = () => {
    loadSeedSkills()
  }

  const hasSkills = state.skills.length > 0
  const sortedSkills = [...state.skills].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          Навыки
        </h1>
        {hasSkills && (
          <button
            onClick={() => setSkillEditing({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            <Plus size={16} strokeWidth={3} />
            Навык
          </button>
        )}
      </div>

      {!hasSkills ? (
        <EmptyState onLoadExamples={loadExamples} onCreate={() => setSkillEditing({ mode: 'new' })} />
      ) : (
        <motion.div className="space-y-3">
          <AnimatePresence>
            {sortedSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                tasks={state.skillTasks.filter((t) => t.skillId === skill.id)}
                currency={state.currency}
                expanded={expanded.has(skill.id)}
                onToggle={() => toggleExpand(skill.id)}
                onEdit={() => setSkillEditing({ mode: 'edit', skill })}
                onAddTask={() => setTaskEditing({ mode: 'new', skillId: skill.id })}
                onCompleteTask={(id) => earnSkillTask(id)}
                onCancelTask={(id) => cancelSkillTask(id)}
                onEditTask={(task) => setTaskEditing({ mode: 'edit', task })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        open={skillEditing !== null}
        onClose={() => setSkillEditing(null)}
        title={skillEditing?.mode === 'edit' ? 'Редактировать навык' : 'Новый навык'}
      >
        {skillEditing && (
          <SkillForm
            initial={skillEditing.mode === 'edit' ? skillEditing.skill : undefined}
            onSubmit={handleSubmitSkill}
            onDelete={skillEditing.mode === 'edit' ? handleDeleteSkill : undefined}
          />
        )}
      </Modal>

      <Modal
        open={taskEditing !== null}
        onClose={() => setTaskEditing(null)}
        title={taskEditing?.mode === 'edit' ? 'Редактировать задание' : 'Новое задание'}
      >
        {taskEditing && (
          <SkillTaskForm
            initial={taskEditing.mode === 'edit' ? taskEditing.task : undefined}
            onSubmit={handleSubmitTask}
            onDelete={taskEditing.mode === 'edit' ? handleDeleteTask : undefined}
          />
        )}
      </Modal>
    </div>
  )
}

function EmptyState({
  onLoadExamples,
  onCreate,
}: {
  onLoadExamples: () => void
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div className="text-6xl mb-4">🚀</div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-2">
        Что хочешь прокачать?
      </h2>
      <p className="text-white/50 text-sm max-w-xs mb-6">
        Каждый навык растёт от своих заданий. Программирование, язык, спорт — что угодно.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={onLoadExamples}
          className="flex items-center justify-center gap-2 py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
        >
          <Sparkles size={18} />
          Загрузить примеры
        </button>
        <button
          onClick={onCreate}
          className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition"
        >
          <Plus size={18} />
          Создать свой
        </button>
      </div>
    </div>
  )
}
