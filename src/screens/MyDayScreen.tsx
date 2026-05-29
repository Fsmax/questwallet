import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CalendarCheck } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { LevelBadge } from '../dashboard/LevelBadge'
import { StreakCard } from '../dashboard/StreakCard'
import { DayProgress } from '../dashboard/DayProgress'
import { WelcomeCard } from '../dashboard/WelcomeCard'
import { DayTaskRow } from '../myday/DayTaskRow'
import { DayTaskForm, type DayTaskFormValues } from '../myday/DayTaskForm'
import { WorkTaskRow } from '../work/WorkTaskRow'
import { Modal } from '../components/Modal'
import { visibleStreak } from '../finance/game'
import type { DayTask, WorkTask } from '../types'

type Editing = { mode: 'new' } | { mode: 'edit'; task: DayTask } | null

type DayItem =
  | { kind: 'day'; time: string | null; task: DayTask }
  | { kind: 'work'; time: string | null; task: WorkTask }

export function MyDayScreen() {
  const {
    state,
    addDayTask,
    editDayTask,
    deleteDayTask,
    completeDayTask,
    uncompleteDayTask,
    completeWorkTask,
    uncompleteWorkTask,
  } = useAppState()
  const [editing, setEditing] = useState<Editing>(null)

  if (!state) return null

  const handleSubmit = (values: DayTaskFormValues) => {
    if (editing?.mode === 'edit') {
      editDayTask(editing.task.id, values)
    } else {
      addDayTask(values)
    }
    setEditing(null)
  }

  const handleDelete = () => {
    if (editing?.mode !== 'edit') return
    deleteDayTask(editing.task.id)
    setEditing(null)
  }

  // Баллы, набранные за сегодня (квесты + задания навыков).
  const pointsToday =
    state.tasks.filter((t) => t.doneToday).reduce((s, t) => s + t.xpReward, 0) +
    state.skillTasks.filter((t) => t.doneToday).reduce((s, t) => s + t.xpReward, 0)

  const streak = visibleStreak(state, new Date())

  // Расписание дня — дела дня + рабочие таски с галочкой «показывать в Мой день».
  const myDayWork = state.workTasks.filter((t) => t.showInMyDay)
  const items: DayItem[] = [
    ...state.dayTasks.map((t) => ({ kind: 'day' as const, time: t.time, task: t })),
    ...myDayWork.map((t) => ({ kind: 'work' as const, time: t.time, task: t })),
  ].sort((a, b) => {
    const ta = a.time ?? '99:99'
    const tb = b.time ?? '99:99'
    if (ta !== tb) return ta < tb ? -1 : 1
    return a.task.order - b.task.order
  })

  const totalCount = state.dayTasks.length + myDayWork.length
  const doneCount =
    state.dayTasks.filter((t) => t.done).length + myDayWork.filter((t) => t.doneToday).length
  const hasDayTasks = totalCount > 0
  const isFresh = state.balance === 0 && state.transactions.length === 0

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-4"
    >
      {/* Шапка дисциплины */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center gap-4"
      >
        <LevelBadge xp={state.xp} />
        <div className="flex-1 min-w-0">
          <div className="text-white/60 text-sm">Мой день</div>
          <div className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
            Держим дисциплину
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
        className="grid grid-cols-2 gap-3"
      >
        <StreakCard streak={streak} />
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">
            Баллы сегодня
          </div>
          <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-white tabular-nums">
            +{pointsToday}
          </div>
        </div>
      </motion.div>

      {isFresh && (
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
          <WelcomeCard />
        </motion.div>
      )}

      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        <DayProgress
          done={doneCount}
          total={totalCount}
          label="Дела на сегодня"
          Icon={CalendarCheck}
          doneMessage="✨ Все дела на сегодня закрыты"
        />
      </motion.div>

      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
          Расписание дня
        </h2>
        {hasDayTasks && (
          <button
            onClick={() => setEditing({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить
          </button>
        )}
      </div>

      {!hasDayTasks ? (
        <EmptyState onCreate={() => setEditing({ mode: 'new' })} />
      ) : (
        <motion.div className="space-y-2">
          <AnimatePresence>
            {items.map((item) =>
              item.kind === 'day' ? (
                <DayTaskRow
                  key={`d-${item.task.id}`}
                  task={item.task}
                  onComplete={() => completeDayTask(item.task.id)}
                  onUncomplete={() => uncompleteDayTask(item.task.id)}
                  onEdit={() => setEditing({ mode: 'edit', task: item.task })}
                />
              ) : (
                <WorkTaskRow
                  key={`w-${item.task.id}`}
                  task={item.task}
                  currency={state.currency}
                  onComplete={() => completeWorkTask(item.task.id)}
                  onUncomplete={() => uncompleteWorkTask(item.task.id)}
                />
              ),
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Редактировать дело' : 'Новое дело'}
      >
        {editing && (
          <DayTaskForm
            initial={editing.mode === 'edit' ? editing.task : undefined}
            onSubmit={handleSubmit}
            onDelete={editing.mode === 'edit' ? handleDelete : undefined}
          />
        )}
      </Modal>
    </motion.div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div className="text-6xl mb-4">🌅</div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-2">
        Спланируй свой день
      </h2>
      <p className="text-white/50 text-sm max-w-xs mb-6">
        Добавь дела на сегодня — со временем и напоминаниями. Выполняй их и держи серию.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center justify-center gap-2 py-3 px-5 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        <Plus size={18} />
        Добавить первое дело
      </button>
    </div>
  )
}
