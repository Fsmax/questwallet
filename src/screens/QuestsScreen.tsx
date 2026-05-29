import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useConfirm } from '../components/ConfirmProvider'
import { QuestCard } from '../quests/QuestCard'
import { QuestForm, type QuestFormValues } from '../quests/QuestForm'
import { Modal } from '../components/Modal'
import { SEED_TASKS } from '../lib/seed'
import type { Task } from '../types'

type Editing = { mode: 'new' } | { mode: 'edit'; task: Task } | null

export function QuestsScreen() {
  const { state, earn, cancel, addTask, editTask, deleteTask } = useAppState()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<Editing>(null)

  if (!state) return null

  const handleSubmit = (values: QuestFormValues) => {
    if (editing?.mode === 'edit') {
      editTask(editing.task.id, values)
    } else {
      addTask(values)
    }
    setEditing(null)
  }

  const handleDelete = async () => {
    if (editing?.mode !== 'edit') return
    const taskId = editing.task.id
    if (await confirm({ message: 'Удалить квест? Баллы за прошлые выполнения останутся.', danger: true })) {
      deleteTask(taskId)
      setEditing(null)
    }
  }

  const loadExamples = () => {
    SEED_TASKS.forEach((t) => addTask(t))
  }

  const hasTasks = state.tasks.length > 0
  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (a.doneToday !== b.doneToday) return a.doneToday ? 1 : -1
    return 0
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          Квесты
        </h1>
        {hasTasks && (
          <button
            onClick={() => setEditing({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить
          </button>
        )}
      </div>

      {!hasTasks ? (
        <EmptyState onLoadExamples={loadExamples} onCreate={() => setEditing({ mode: 'new' })} />
      ) : (
        <motion.div className="space-y-3">
          <AnimatePresence>
            {sortedTasks.map((task) => (
              <QuestCard
                key={task.id}
                task={task}
                onComplete={() => earn(task.id)}
                onCancel={() => cancel(task.id)}
                onEdit={() => setEditing({ mode: 'edit', task })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Редактировать квест' : 'Новый квест'}
      >
        {editing && (
          <QuestForm
            initial={editing.mode === 'edit' ? editing.task : undefined}
            onSubmit={handleSubmit}
            onDelete={editing.mode === 'edit' ? handleDelete : undefined}
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
      <div className="text-6xl mb-4">⚔️</div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-2">
        У тебя пока нет квестов
      </h2>
      <p className="text-white/50 text-sm max-w-xs mb-6">
        Добавь свои привычки или начни с примеров — потом всё можно поменять.
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
          Создать своё
        </button>
      </div>
    </div>
  )
}
