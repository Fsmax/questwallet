import type { AppState, Currency } from '../types'
import { FinanceError } from './finance'

/**
 * Пересчитать все денежные суммы состояния при смене валюты.
 * `rate` — сколько сум за 1 доллар (например, 12500).
 *
 * Конвертируются текущие величины: баланс, всего заработано, цели, долги,
 * регулярные расходы, награды квестов и навыков. История транзакций НЕ трогается —
 * прошлые записи остаются в тех числах, в которых были сделаны.
 */
export function convertState(state: AppState, to: Currency, rate: number): AppState {
  if (state.currency === to) return state
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new FinanceError('INVALID_RATE', 'Курс должен быть больше нуля')
  }

  const toUsd = to === 'USD'
  const factor = toUsd ? 1 / rate : rate
  const round = toUsd
    ? (n: number) => Math.round(n * 100) / 100 // доллары — 2 знака
    : (n: number) => Math.round(n) // сумы — целые
  const conv = (n: number) => round(n * factor)

  return {
    ...state,
    currency: to,
    balance: conv(state.balance),
    totalEarned: conv(state.totalEarned),
    goals: state.goals.map((g) => ({ ...g, target: conv(g.target), saved: conv(g.saved) })),
    debts: state.debts.map((d) => ({ ...d, principal: conv(d.principal), paid: conv(d.paid) })),
    recurringExpenses: state.recurringExpenses.map((r) => ({ ...r, amount: conv(r.amount) })),
    tasks: state.tasks.map((t) => ({ ...t, reward: conv(t.reward) })),
    skillTasks: state.skillTasks.map((t) => ({ ...t, reward: conv(t.reward) })),
  }
}
