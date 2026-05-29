import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useConfirm } from '../components/ConfirmProvider'
import { SettingsCard } from './SettingsCard'
import { Modal } from '../components/Modal'
import { RecurringForm, type RecurringFormValues } from './RecurringForm'
import { formatMoney } from '../lib/format'
import type { RecurringExpense } from '../types'

type Editing = { mode: 'new' } | { mode: 'edit'; rec: RecurringExpense } | null

export function RecurringSection() {
  const { state, addRecurring, editRecurring, deleteRecurring } = useAppState()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<Editing>(null)

  if (!state) return null

  // Доход (зарплата/инвестиции) живёт во вкладке «Работа» — здесь только расходы.
  const list = [...state.recurringExpenses]
    .filter((r) => r.kind !== 'income')
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
  const catName = (id: string | null) =>
    id ? state.expenseCategories.find((c) => c.id === id)?.title ?? null : null

  const handleSubmit = (values: RecurringFormValues) => {
    if (editing?.mode === 'edit') editRecurring(editing.rec.id, values)
    else addRecurring(values)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (editing?.mode !== 'edit') return
    const rec = editing.rec
    setEditing(null)
    if (await confirm({ message: `Удалить регулярный расход «${rec.title}»?`, danger: true })) {
      deleteRecurring(rec.id)
    }
  }

  return (
    <SettingsCard title="Регулярные платежи">
      {list.length === 0 ? (
        <p className="text-xs text-white/55 mb-3">
          Подписки, аренда, кредит — добавь, и они будут напоминать о себе в Кошельке каждый месяц.
          Доход (зарплата, инвестиции) настраивается во вкладке «Работа».
        </p>
      ) : (
        <div className="space-y-1 mb-3">
          {list.map((r) => {
            const cat = catName(r.category)
            const income = r.kind === 'income'
            return (
              <button
                key={r.id}
                onClick={() => setEditing({ mode: 'edit', rec: r })}
                className="w-full flex items-center gap-3 py-2 text-left hover:bg-white/[0.03] rounded-lg px-1 transition"
              >
                <span className="text-xl">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{r.title}</div>
                  <div className="text-xs text-white/55">
                    {r.dayOfMonth}-го числа{income ? ' · доход' : cat ? ` · ${cat}` : ''}
                  </div>
                </div>
                <div
                  className={`font-bold tabular-nums text-sm ${
                    income ? 'text-[var(--color-emerald-quest)]' : 'text-white'
                  }`}
                >
                  {income ? '+' : '−'}
                  {formatMoney(r.amount, state.currency)}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setEditing({ mode: 'new' })}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition"
      >
        <Plus size={16} />
        Добавить
      </button>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Регулярный платёж' : 'Новый регулярный платёж'}
      >
        {editing && (
          <RecurringForm
            initial={editing.mode === 'edit' ? editing.rec : undefined}
            categories={state.expenseCategories}
            lockKind="expense"
            onSubmit={handleSubmit}
            onDelete={editing.mode === 'edit' ? handleDelete : undefined}
          />
        )}
      </Modal>
    </SettingsCard>
  )
}
