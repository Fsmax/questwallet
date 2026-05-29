import type { AppState, ExpenseCategory, RecurringExpense, Transaction } from '../types'
import { MAX_TRANSACTIONS_IN_STATE } from '../types'
import { getCurrentDay } from '../lib/dates'
import { FinanceError, validateAmount, validateLabel, type ApplyResult } from './finance'

function newId(): string {
  return crypto.randomUUID()
}

function appendTx(state: AppState, tx: Transaction): Transaction[] {
  return [tx, ...state.transactions].slice(0, MAX_TRANSACTIONS_IN_STATE)
}

/** Текущий «месяц» пользователя в формате YYYY-MM с учётом таймзоны и часа сброса. */
export function currentMonth(state: AppState, now: Date): string {
  return getCurrentDay(now, state.timezone, state.dayResetHour).slice(0, 7)
}

// ============= Категории =============

export function applyAddCategory(
  state: AppState,
  input: { title: string; emoji: string },
): AppState {
  validateLabel(input.title)
  const maxOrder = state.expenseCategories.reduce((m, c) => Math.max(m, c.order), -1)
  return {
    ...state,
    expenseCategories: [
      ...state.expenseCategories,
      {
        id: newId(),
        title: input.title.trim(),
        emoji: input.emoji.trim() || '📦',
        order: maxOrder + 1,
      },
    ],
  }
}

export function applyEditCategory(
  state: AppState,
  id: string,
  patch: Partial<Pick<ExpenseCategory, 'title' | 'emoji' | 'order'>>,
): AppState {
  if (!state.expenseCategories.some((c) => c.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Категория не найдена')
  }
  if (patch.title !== undefined) validateLabel(patch.title)
  return {
    ...state,
    expenseCategories: state.expenseCategories.map((c) =>
      c.id === id ? { ...c, ...patch } : c,
    ),
  }
}

/**
 * Удалить категорию. Регулярные расходы, ссылавшиеся на неё, теряют категорию.
 * Старые транзакции категорию сохраняют (в статистике попадут в «Без категории»).
 */
export function applyDeleteCategory(state: AppState, id: string): AppState {
  if (!state.expenseCategories.some((c) => c.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Категория не найдена')
  }
  return {
    ...state,
    expenseCategories: state.expenseCategories.filter((c) => c.id !== id),
    recurringExpenses: state.recurringExpenses.map((r) =>
      r.category === id ? { ...r, category: null } : r,
    ),
  }
}

// ============= Регулярные расходы =============

function validateDayOfMonth(day: number): void {
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    throw new FinanceError('INVALID_DAY', 'День месяца должен быть от 1 до 28')
  }
}

export function applyAddRecurring(
  state: AppState,
  input: { title: string; emoji: string; amount: number; dayOfMonth: number; category: string | null },
  now: Date,
): AppState {
  validateLabel(input.title)
  validateAmount(input.amount)
  validateDayOfMonth(input.dayOfMonth)
  const maxOrder = state.recurringExpenses.reduce((m, r) => Math.max(m, r.order), -1)
  return {
    ...state,
    recurringExpenses: [
      ...state.recurringExpenses,
      {
        id: newId(),
        title: input.title.trim(),
        emoji: input.emoji.trim() || '🔁',
        amount: input.amount,
        dayOfMonth: input.dayOfMonth,
        category: input.category,
        order: maxOrder + 1,
        createdAt: now.getTime(),
        lastChargedMonth: null,
      },
    ],
  }
}

export function applyEditRecurring(
  state: AppState,
  id: string,
  patch: Partial<Pick<RecurringExpense, 'title' | 'emoji' | 'amount' | 'dayOfMonth' | 'category' | 'order'>>,
): AppState {
  if (!state.recurringExpenses.some((r) => r.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Регулярный расход не найден')
  }
  if (patch.title !== undefined) validateLabel(patch.title)
  if (patch.amount !== undefined) validateAmount(patch.amount)
  if (patch.dayOfMonth !== undefined) validateDayOfMonth(patch.dayOfMonth)
  return {
    ...state,
    recurringExpenses: state.recurringExpenses.map((r) =>
      r.id === id ? { ...r, ...patch } : r,
    ),
  }
}

export function applyDeleteRecurring(state: AppState, id: string): AppState {
  return {
    ...state,
    recurringExpenses: state.recurringExpenses.filter((r) => r.id !== id),
  }
}

/**
 * Списать регулярный расход за текущий месяц: создаёт обычную трату (spend)
 * с категорией расхода и помечает месяц, чтобы не списать повторно.
 */
export function applyChargeRecurring(state: AppState, id: string, now: Date): ApplyResult {
  const rec = state.recurringExpenses.find((r) => r.id === id)
  if (!rec) throw new FinanceError('NOT_FOUND', 'Регулярный расход не найден')
  validateAmount(rec.amount)
  if (rec.amount > state.balance) {
    throw new FinanceError('INSUFFICIENT_BALANCE', 'Недостаточно денег в кошельке')
  }
  const month = currentMonth(state, now)
  if (rec.lastChargedMonth === month) {
    throw new FinanceError('ALREADY_CHARGED', 'Этот расход уже списан в этом месяце')
  }
  const category =
    rec.category && state.expenseCategories.some((c) => c.id === rec.category)
      ? rec.category
      : undefined

  const tx: Transaction = {
    id: newId(),
    type: 'spend',
    amount: rec.amount,
    label: rec.title,
    timestamp: now.getTime(),
    ...(category ? { category } : {}),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance - rec.amount,
    recurringExpenses: state.recurringExpenses.map((r) =>
      r.id === id ? { ...r, lastChargedMonth: month } : r,
    ),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/** Регулярные расходы, которые в этом месяце уже наступили (день прошёл) и ещё не списаны. */
export function dueRecurring(state: AppState, now: Date): RecurringExpense[] {
  const month = currentMonth(state, now)
  const todayDay = Number(getCurrentDay(now, state.timezone, state.dayResetHour).slice(8, 10))
  return state.recurringExpenses
    .filter((r) => r.lastChargedMonth !== month && r.dayOfMonth <= todayDay)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
}
