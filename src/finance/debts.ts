import type { AppState, Debt, DebtDirection, Transaction } from '../types'
import { MAX_TRANSACTIONS_IN_STATE } from '../types'
import { FinanceError, validateAmount, validateLabel, type ApplyResult } from './finance'

function newId(): string {
  return crypto.randomUUID()
}

function appendTx(state: AppState, tx: Transaction): Transaction[] {
  return [tx, ...state.transactions].slice(0, MAX_TRANSACTIONS_IN_STATE)
}

/** Остаток по долгу (сколько ещё не погашено). */
export function debtRemaining(debt: Debt): number {
  return Math.max(0, debt.principal - debt.paid)
}

export interface AddDebtInput {
  direction: DebtDirection
  person: string
  emoji: string
  principal: number
  note: string
  dueDate: string | null
}

/**
 * Создать долг с движением по балансу:
 * - owed_to_me (я дал в долг): баланс −principal (нельзя дать больше, чем есть), tx 'lend'
 * - i_owe (я взял в долг): баланс +principal, tx 'borrow'
 */
export function applyAddDebt(state: AppState, input: AddDebtInput, now: Date): ApplyResult {
  validateLabel(input.person)
  validateAmount(input.principal)

  const isOwedToMe = input.direction === 'owed_to_me'
  if (isOwedToMe && input.principal > state.balance) {
    throw new FinanceError('INSUFFICIENT_BALANCE', 'Нельзя дать в долг больше, чем есть в кошельке')
  }

  const maxOrder = state.debts.reduce((m, d) => Math.max(m, d.order), -1)
  const debt: Debt = {
    id: newId(),
    direction: input.direction,
    person: input.person.trim(),
    emoji: input.emoji.trim() || (isOwedToMe ? '🤝' : '💳'),
    principal: input.principal,
    paid: 0,
    note: input.note.trim(),
    dueDate: input.dueDate,
    order: maxOrder + 1,
    createdAt: now.getTime(),
    settledAt: null,
  }

  const tx: Transaction = {
    id: newId(),
    type: isOwedToMe ? 'lend' : 'borrow',
    amount: input.principal,
    label: isOwedToMe ? `В долг: ${debt.person}` : `Взял в долг: ${debt.person}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: isOwedToMe ? state.balance - input.principal : state.balance + input.principal,
    debts: [...state.debts, debt],
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Погасить часть/весь долг с движением по балансу:
 * - owed_to_me (мне вернули): баланс +amount, tx 'collect'
 * - i_owe (я отдал): баланс −amount (нельзя больше, чем есть), tx 'settle'
 */
export function applyRepayDebt(
  state: AppState,
  debtId: string,
  amount: number,
  now: Date,
): ApplyResult {
  validateAmount(amount)
  const debt = state.debts.find((d) => d.id === debtId)
  if (!debt) throw new FinanceError('NOT_FOUND', 'Долг не найден')

  const remaining = debtRemaining(debt)
  if (remaining <= 0) throw new FinanceError('ALREADY_SETTLED', 'Долг уже погашен')
  if (amount > remaining) throw new FinanceError('OVER_REPAY', 'Сумма больше остатка долга')

  const isOwedToMe = debt.direction === 'owed_to_me'
  if (!isOwedToMe && amount > state.balance) {
    throw new FinanceError('INSUFFICIENT_BALANCE', 'Недостаточно денег в кошельке')
  }

  const newPaid = debt.paid + amount
  const settledAt = newPaid >= debt.principal ? now.getTime() : debt.settledAt

  const tx: Transaction = {
    id: newId(),
    type: isOwedToMe ? 'collect' : 'settle',
    amount,
    label: isOwedToMe ? `Возврат долга: ${debt.person}` : `Погашение долга: ${debt.person}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: isOwedToMe ? state.balance + amount : state.balance - amount,
    debts: state.debts.map((d) => (d.id === debtId ? { ...d, paid: newPaid, settledAt } : d)),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Редактировать долг (имя/эмодзи/заметку/срок/сумму). Баланс НЕ меняется —
 * как и у целей: правка суммы лишь корректирует трекинг, деньги двигаются через погашение.
 */
export function applyEditDebt(
  state: AppState,
  debtId: string,
  patch: Partial<Pick<Debt, 'person' | 'emoji' | 'note' | 'dueDate' | 'principal' | 'order'>>,
  now: Date,
): AppState {
  const debt = state.debts.find((d) => d.id === debtId)
  if (!debt) throw new FinanceError('NOT_FOUND', 'Долг не найден')
  if (patch.person !== undefined) validateLabel(patch.person)
  if (patch.principal !== undefined) validateAmount(patch.principal)

  const newPrincipal = patch.principal ?? debt.principal
  let settledAt = debt.settledAt
  if (newPrincipal <= debt.paid && !debt.settledAt) {
    settledAt = now.getTime()
  } else if (newPrincipal > debt.paid && debt.settledAt) {
    settledAt = null
  }

  return {
    ...state,
    debts: state.debts.map((d) => (d.id === debtId ? { ...d, ...patch, settledAt } : d)),
  }
}

/** Удалить долг. Прошлые движения по балансу остаются в истории (как при удалении задания/цели). */
export function applyDeleteDebt(state: AppState, debtId: string): AppState {
  if (!state.debts.some((d) => d.id === debtId)) {
    throw new FinanceError('NOT_FOUND', 'Долг не найден')
  }
  return {
    ...state,
    debts: state.debts.filter((d) => d.id !== debtId),
  }
}

export interface DebtTotals {
  owedToMe: number // сколько мне должны (остаток)
  iOwe: number // сколько должен я (остаток)
  net: number // owedToMe - iOwe
}

/** Сводка по активным долгам (по остаткам непогашенного). */
export function debtTotals(debts: Debt[]): DebtTotals {
  let owedToMe = 0
  let iOwe = 0
  for (const d of debts) {
    const rem = debtRemaining(d)
    if (rem <= 0) continue
    if (d.direction === 'owed_to_me') owedToMe += rem
    else iOwe += rem
  }
  return { owedToMe, iOwe, net: owedToMe - iOwe }
}
