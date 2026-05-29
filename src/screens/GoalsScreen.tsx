import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useAppState } from '../state/AppStateContext'
import { GoalCard } from '../goals/GoalCard'
import { GoalForm, type GoalFormValues } from '../goals/GoalForm'
import { AmountDialog } from '../goals/AmountDialog'
import { DeleteGoalDialog } from '../goals/DeleteGoalDialog'
import { Modal } from '../components/Modal'
import { SEED_GOALS } from '../lib/seed'
import type { Goal } from '../types'
import type { DeleteGoalMode } from '../finance/finance'

type Editing = { mode: 'new' } | { mode: 'edit'; goal: Goal } | null
type AmountDialog =
  | { kind: 'save'; goal: Goal }
  | { kind: 'withdraw'; goal: Goal }
  | null

export function GoalsScreen() {
  const { state, save, withdraw, addGoal, editGoal, deleteGoal } = useAppState()
  const [editing, setEditing] = useState<Editing>(null)
  const [amount, setAmount] = useState<AmountDialog>(null)
  const [deleting, setDeleting] = useState<Goal | null>(null)

  const completedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!state) return
    if (completedRef.current.size === 0) {
      // первичная инициализация: запомнить уже выполненные, чтобы не палить конфетти при загрузке
      state.goals.forEach((g) => {
        if (g.completedAt) completedRef.current.add(g.id)
      })
      return
    }
    for (const g of state.goals) {
      if (g.completedAt && !completedRef.current.has(g.id)) {
        completedRef.current.add(g.id)
        fireConfetti()
      } else if (!g.completedAt && completedRef.current.has(g.id)) {
        // цель вернулась в активные (target подняли или сняли деньги)
        completedRef.current.delete(g.id)
      }
    }
  }, [state])

  if (!state) return null

  const handleSubmit = (values: GoalFormValues) => {
    if (editing?.mode === 'edit') {
      editGoal(editing.goal.id, values)
    } else {
      addGoal(values)
    }
    setEditing(null)
  }

  const handleDeleteRequest = () => {
    if (editing?.mode !== 'edit') return
    const goal = editing.goal
    setEditing(null)
    if (goal.saved === 0) {
      if (confirm(`Удалить цель «${goal.title}»?`)) {
        deleteGoal(goal.id, 'return_to_wallet')
      }
    } else {
      setDeleting(goal)
    }
  }

  const handleDeleteChoice = (mode: DeleteGoalMode) => {
    if (!deleting) return
    deleteGoal(deleting.id, mode)
    setDeleting(null)
  }

  const handleAmountSubmit = (n: number) => {
    if (!amount) return
    if (amount.kind === 'save') save(amount.goal.id, n)
    else withdraw(amount.goal.id, n)
    setAmount(null)
  }

  const loadExamples = () => {
    SEED_GOALS.forEach((g) => addGoal(g))
  }

  const hasGoals = state.goals.length > 0
  const sortedGoals = [...state.goals].sort((a, b) => {
    if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? 1 : -1
    return a.order - b.order
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
          Цели
        </h1>
        {hasGoals && (
          <button
            onClick={() => setEditing({ mode: 'new' })}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl text-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            <Plus size={16} strokeWidth={3} />
            Добавить
          </button>
        )}
      </div>

      {!hasGoals ? (
        <EmptyState onLoadExamples={loadExamples} onCreate={() => setEditing({ mode: 'new' })} />
      ) : (
        <motion.div className="space-y-3">
          <AnimatePresence>
            {sortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currency={state.currency}
                walletBalance={state.balance}
                onSave={() => setAmount({ kind: 'save', goal })}
                onWithdraw={() => setAmount({ kind: 'withdraw', goal })}
                onEdit={() => setEditing({ mode: 'edit', goal })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Редактировать цель' : 'Новая цель'}
      >
        {editing && (
          <GoalForm
            initial={editing.mode === 'edit' ? editing.goal : undefined}
            onSubmit={handleSubmit}
            onDelete={editing.mode === 'edit' ? handleDeleteRequest : undefined}
          />
        )}
      </Modal>

      <Modal
        open={amount !== null}
        onClose={() => setAmount(null)}
        title={amount?.kind === 'save' ? `Отложить на «${amount.goal.title}»` : `Снять с «${amount?.goal.title}»`}
      >
        {amount && (
          <AmountDialog
            max={amount.kind === 'save' ? state.balance : amount.goal.saved}
            currency={state.currency}
            ctaLabel={amount.kind === 'save' ? 'Отложить' : 'Снять'}
            ctaColor={amount.kind === 'save' ? 'emerald' : 'gold'}
            hint={
              amount.kind === 'save'
                ? `На цели сейчас ${amount.goal.saved}`
                : `В кошельке станет: ${state.balance + amount.goal.saved}`
            }
            onSubmit={handleAmountSubmit}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Удалить цель"
      >
        {deleting && (
          <DeleteGoalDialog
            goal={deleting}
            currency={state.currency}
            onChoose={handleDeleteChoice}
            onCancel={() => setDeleting(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    startVelocity: 45,
    origin: { y: 0.55 },
    colors: ['#FFD66B', '#3DDC97', '#FF7A5C', '#ffffff'],
  })
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      startVelocity: 30,
      origin: { x: 0.2, y: 0.6 },
      colors: ['#FFD66B', '#3DDC97'],
    })
    confetti({
      particleCount: 60,
      spread: 100,
      startVelocity: 30,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#FFD66B', '#FF7A5C'],
    })
  }, 250)
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
      <div className="text-6xl mb-4">🎯</div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-2">
        У тебя пока нет целей
      </h2>
      <p className="text-white/50 text-sm max-w-xs mb-6">
        Накопления — это весело. Добавь цель или загрузи примеры.
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
          Создать свою
        </button>
      </div>
    </div>
  )
}
