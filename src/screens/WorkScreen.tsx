import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Briefcase, TrendingUp } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useConfirm } from '../components/ConfirmProvider'
import { WorkTaskRow } from '../work/WorkTaskRow'
import { WorkTaskForm, type WorkTaskFormValues } from '../work/WorkTaskForm'
import { RecurringForm, type RecurringFormValues } from '../settings/RecurringForm'
import { Modal } from '../components/Modal'
import { formatMoney } from '../lib/format'
import { dueRecurring } from '../finance/expenses'
import type { WorkTask, RecurringExpense } from '../types'

type EditingTask = { mode: 'new' } | { mode: 'edit'; task: WorkTask } | null
type EditingIncome = { mode: 'new' } | { mode: 'edit'; rec: RecurringExpense } | null

export function WorkScreen() {
  const {
    state,
    addWorkTask,
    editWorkTask,
    deleteWorkTask,
    completeWorkTask,
    uncompleteWorkTask,
    addRecurring,
    editRecurring,
    deleteRecurring,
    chargeRecurring,
  } = useAppState()
  const confirm = useConfirm()
  const [editingTask, setEditingTask] = useState<EditingTask>(null)
  const [editingIncome, setEditingIncome] = useState<EditingIncome>(null)

  if (!state) return null

  const tasks = [...state.workTasks].sort((a, b) => {
    const ta = a.time ?? '99:99'
    const tb = b.time ?? '99:99'
    if (ta !== tb) return ta < tb ? -1 : 1
    return a.order - b.order
  })
  const earnedToday = state.workTasks
    .filter((t) => t.doneToday)
    .reduce((s, t) => s + t.amount, 0)

  const incomes = [...state.recurringExpenses]
    .filter((r) => r.kind === 'income')
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
  const dueIncomeIds = new Set(
    dueRecurring(state, new Date())
      .filter((r) => r.kind === 'income')
      .map((r) => r.id),
  )

  const handleTaskSubmit = (values: WorkTaskFormValues) => {
    if (editingTask?.mode === 'edit') editWorkTask(editingTask.task.id, values)
    else addWorkTask(values)
    setEditingTask(null)
  }
  const handleTaskDelete = () => {
    if (editingTask?.mode !== 'edit') return
    deleteWorkTask(editingTask.task.id)
    setEditingTask(null)
  }

  const handleIncomeSubmit = (values: RecurringFormValues) => {
    if (editingIncome?.mode === 'edit') editRecurring(editingIncome.rec.id, values)
    else addRecurring(values)
    setEditingIncome(null)
  }
  const handleIncomeDelete = async () => {
    if (editingIncome?.mode !== 'edit') return
    const rec = editingIncome.rec
    setEditingIncome(null)
    if (await confirm({ message: `Удалить источник дохода «${rec.title}»?`, danger: true })) {
      deleteRecurring(rec.id)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-4"
    >
      {/* Шапка */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-gold)]/15 flex items-center justify-center flex-shrink-0">
          <Briefcase className="text-[var(--color-gold)]" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white/60 text-sm">Работа</div>
          <div className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
            Заработок
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">Сегодня</div>
          <div className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-emerald-quest)] tabular-nums">
            +{formatMoney(earnedToday, state.currency)}
          </div>
        </div>
      </motion.div>

      {/* Рабочие таски */}
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
          Рабочие таски
        </h2>
        {tasks.length > 0 && (
          <button
            onClick={() => setEditingTask({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyTasks onCreate={() => setEditingTask({ mode: 'new' })} />
      ) : (
        <motion.div className="space-y-2">
          <AnimatePresence>
            {tasks.map((task) => (
              <WorkTaskRow
                key={task.id}
                task={task}
                currency={state.currency}
                onComplete={() => completeWorkTask(task.id)}
                onUncomplete={() => uncompleteWorkTask(task.id)}
                onEdit={() => setEditingTask({ mode: 'edit', task })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Регулярный доход (зарплата, инвестиции) */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold text-white">
          <TrendingUp size={18} className="text-[var(--color-emerald-quest)]" />
          Регулярный доход
        </h2>
        {incomes.length > 0 && (
          <button
            onClick={() => setEditingIncome({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/10 transition"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить
          </button>
        )}
      </div>

      {incomes.length === 0 ? (
        <button
          onClick={() => setEditingIncome({ mode: 'new' })}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10 transition text-sm"
        >
          <Plus size={16} />
          Добавить зарплату или доход с инвестиций
        </button>
      ) : (
        <div className="space-y-2">
          {incomes.map((r) => {
            const due = dueIncomeIds.has(r.id)
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
              >
                <span className="text-xl w-7 text-center flex-shrink-0">{r.emoji}</span>
                <button
                  onClick={() => setEditingIncome({ mode: 'edit', rec: r })}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="text-white text-sm truncate font-semibold">{r.title}</div>
                  <div className="text-xs text-white/55">{r.dayOfMonth}-го числа · доход</div>
                </button>
                <div className="font-bold tabular-nums text-sm text-[var(--color-emerald-quest)]">
                  +{formatMoney(r.amount, state.currency)}
                </div>
                {due && (
                  <button
                    onClick={() => chargeRecurring(r.id)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)] text-xs font-bold hover:brightness-110 active:scale-95 transition flex-shrink-0"
                  >
                    Получить
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title={editingTask?.mode === 'edit' ? 'Рабочий таск' : 'Новый рабочий таск'}
      >
        {editingTask && (
          <WorkTaskForm
            initial={editingTask.mode === 'edit' ? editingTask.task : undefined}
            onSubmit={handleTaskSubmit}
            onDelete={editingTask.mode === 'edit' ? handleTaskDelete : undefined}
          />
        )}
      </Modal>

      <Modal
        open={editingIncome !== null}
        onClose={() => setEditingIncome(null)}
        title={editingIncome?.mode === 'edit' ? 'Источник дохода' : 'Новый доход'}
      >
        {editingIncome && (
          <RecurringForm
            initial={editingIncome.mode === 'edit' ? editingIncome.rec : undefined}
            categories={state.expenseCategories}
            lockKind="income"
            onSubmit={handleIncomeSubmit}
            onDelete={editingIncome.mode === 'edit' ? handleIncomeDelete : undefined}
          />
        )}
      </Modal>
    </motion.div>
  )
}

function EmptyTasks({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="text-5xl mb-3">💼</div>
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-white mb-2">
        Добавь источник заработка
      </h2>
      <p className="text-white/50 text-sm max-w-xs mb-5">
        Рабочие таски — то, за что ты получаешь деньги. Выполнил → сумма падает в кошелёк.
        Можно показывать их в «Мой день».
      </p>
      <button
        onClick={onCreate}
        className="flex items-center justify-center gap-2 py-3 px-5 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        <Plus size={18} />
        Добавить первый таск
      </button>
    </div>
  )
}
