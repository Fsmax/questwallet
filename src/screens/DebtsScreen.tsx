import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, HandCoins, Landmark } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { DebtCard } from '../debts/DebtCard'
import { DebtForm, type DebtFormValues } from '../debts/DebtForm'
import { AmountDialog } from '../goals/AmountDialog'
import { Modal } from '../components/Modal'
import { debtRemaining, debtTotals } from '../finance/debts'
import { formatMoney } from '../lib/format'
import type { Debt } from '../types'

type Editing = { mode: 'new' } | { mode: 'edit'; debt: Debt } | null

export function DebtsScreen() {
  const { state, addDebt, repayDebt, editDebt, deleteDebt } = useAppState()
  const [editing, setEditing] = useState<Editing>(null)
  const [repaying, setRepaying] = useState<Debt | null>(null)

  if (!state) return null

  const totals = debtTotals(state.debts)

  const sortDebts = (list: Debt[]) =>
    [...list].sort((a, b) => {
      const aSettled = debtRemaining(a) <= 0
      const bSettled = debtRemaining(b) <= 0
      if (aSettled !== bSettled) return aSettled ? 1 : -1
      return a.order - b.order
    })

  const owedToMe = sortDebts(state.debts.filter((d) => d.direction === 'owed_to_me'))
  const iOwe = sortDebts(state.debts.filter((d) => d.direction === 'i_owe'))

  const handleSubmit = (values: DebtFormValues) => {
    if (editing?.mode === 'edit') {
      editDebt(editing.debt.id, {
        person: values.person,
        emoji: values.emoji,
        note: values.note,
        dueDate: values.dueDate,
        principal: values.principal,
      })
    } else {
      addDebt(values)
    }
    setEditing(null)
  }

  const handleDelete = () => {
    if (editing?.mode !== 'edit') return
    const debt = editing.debt
    setEditing(null)
    if (confirm(`Удалить долг «${debt.person}»? Прошлые операции останутся в истории, баланс не изменится.`)) {
      deleteDebt(debt.id)
    }
  }

  const handleRepay = (n: number) => {
    if (!repaying) return
    repayDebt(repaying.id, n)
    setRepaying(null)
  }

  const hasDebts = state.debts.length > 0
  const repayMax = repaying
    ? repaying.direction === 'owed_to_me'
      ? debtRemaining(repaying)
      : Math.min(debtRemaining(repaying), state.balance)
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">Долги</h1>
        {hasDebts && (
          <button
            onClick={() => setEditing({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить
          </button>
        )}
      </div>

      {hasDebts && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
              <HandCoins size={14} className="text-[var(--color-emerald-quest)]" /> Мне должны
            </div>
            <div className="text-lg font-bold tabular-nums text-[var(--color-emerald-quest)]">
              {formatMoney(totals.owedToMe, state.currency)}
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
              <Landmark size={14} className="text-[var(--color-coral)]" /> Я должен
            </div>
            <div className="text-lg font-bold tabular-nums text-[var(--color-coral)]">
              {formatMoney(totals.iOwe, state.currency)}
            </div>
          </div>
        </div>
      )}

      {!hasDebts ? (
        <EmptyState onCreate={() => setEditing({ mode: 'new' })} />
      ) : (
        <div className="space-y-5">
          {owedToMe.length > 0 && (
            <Section title="Мне должны">
              <AnimatePresence>
                {owedToMe.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    currency={state.currency}
                    onRepay={() => setRepaying(debt)}
                    onEdit={() => setEditing({ mode: 'edit', debt })}
                  />
                ))}
              </AnimatePresence>
            </Section>
          )}

          {iOwe.length > 0 && (
            <Section title="Я должен">
              <AnimatePresence>
                {iOwe.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    currency={state.currency}
                    onRepay={() => setRepaying(debt)}
                    onEdit={() => setEditing({ mode: 'edit', debt })}
                  />
                ))}
              </AnimatePresence>
            </Section>
          )}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Редактировать долг' : 'Новый долг'}
      >
        {editing && (
          <DebtForm
            initial={editing.mode === 'edit' ? editing.debt : undefined}
            onSubmit={handleSubmit}
            onDelete={editing.mode === 'edit' ? handleDelete : undefined}
          />
        )}
      </Modal>

      <Modal
        open={repaying !== null}
        onClose={() => setRepaying(null)}
        title={
          repaying?.direction === 'owed_to_me'
            ? `Вернули: ${repaying?.person}`
            : `Отдать: ${repaying?.person}`
        }
      >
        {repaying && (
          <AmountDialog
            max={repayMax}
            currency={state.currency}
            ctaLabel={repaying.direction === 'owed_to_me' ? 'Записать возврат' : 'Записать погашение'}
            ctaColor={repaying.direction === 'owed_to_me' ? 'emerald' : 'coral'}
            hint={`Остаток долга: ${formatMoney(debtRemaining(repaying), state.currency)}`}
            onSubmit={handleRepay}
          />
        )}
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-white/40 font-bold mb-2 px-1">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div className="text-6xl mb-4">🤝</div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-2">
        Долгов пока нет
      </h2>
      <p className="text-white/50 text-sm max-w-xs mb-6">
        Отмечай, кто должен тебе и кому должен ты. Суммы будут двигать баланс кошелька.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center justify-center gap-2 py-3 px-5 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        <Plus size={18} />
        Добавить долг
      </button>
    </div>
  )
}
