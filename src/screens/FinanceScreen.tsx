import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { NetWorthCard } from '../dashboard/NetWorthCard'
import { NearestGoalCard } from '../dashboard/NearestGoalCard'
import { SegmentedTabs } from '../components/SegmentedTabs'
import { WalletScreen } from './WalletScreen'
import { GoalsScreen } from './GoalsScreen'
import { DebtsScreen } from './DebtsScreen'
import { BudgetScreen } from './BudgetScreen'
import { debtTotals } from '../finance/debts'

type FinanceTab = 'wallet' | 'goals' | 'debts' | 'budget'

export function FinanceScreen() {
  const { state } = useAppState()
  const [tab, setTab] = useState<FinanceTab>('wallet')

  if (!state) return null

  const goalsSaved = state.goals.reduce((s, g) => s + g.saved, 0)
  const totals = debtTotals(state.debts)
  const activeGoals = state.goals.filter((g) => !g.completedAt)
  const nearest = activeGoals.length
    ? [...activeGoals].sort(
        (a, b) => b.saved / Math.max(b.target, 1) - a.saved / Math.max(a.target, 1),
      )[0]
    : null

  return (
    <div className="space-y-4">
      {/* Обзор: чистый капитал + ближайшая цель (кроме «Цели» и «Бюджет») */}
      {tab !== 'budget' && (
        <NetWorthCard
          balance={state.balance}
          goalsSaved={goalsSaved}
          owedToMe={totals.owedToMe}
          iOwe={totals.iOwe}
          currency={state.currency}
        />
      )}
      {tab !== 'goals' && tab !== 'budget' && (
        <NearestGoalCard goal={nearest} currency={state.currency} />
      )}

      <SegmentedTabs
        tabs={[
          { id: 'wallet', label: 'Кошелёк' },
          { id: 'goals', label: 'Цели' },
          { id: 'debts', label: 'Долги' },
          { id: 'budget', label: 'Бюджет' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'wallet' && <WalletScreen />}
      {tab === 'goals' && <GoalsScreen />}
      {tab === 'debts' && <DebtsScreen />}
      {tab === 'budget' && <BudgetScreen />}
    </div>
  )
}
