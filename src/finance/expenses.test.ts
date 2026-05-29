import { describe, it, expect } from 'vitest'
import {
  applyAddCategory,
  applyEditCategory,
  applyDeleteCategory,
  applyAddRecurring,
  applyEditRecurring,
  applyDeleteRecurring,
  applyChargeRecurring,
  dueRecurring,
  currentMonth,
} from './expenses'
import { applySpend, FinanceError } from './finance'
import type { AppState, ExpenseCategory, RecurringExpense } from '../types'

// Asia/Tashkent = UTC+5, resetHour=4 → логический день для 09:00Z = 2026-05-28
const NOW = new Date('2026-05-28T09:00:00Z')

function makeState(over: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    schemaVersion: 2,
    timezone: 'Asia/Tashkent',
    dayResetHour: 4,
    currency: 'сум',
    balance: 0,
    totalEarned: 0,
    xp: 0,
    totalCompleted: 0,
    streak: 0,
    streakIncrementedToday: false,
    unlockedAchievements: [],
    lastActiveDate: '',
    lastResetDate: '',
    lastNotifiedDate: { morning: '', evening: '' },
    reminders: {
      enabled: false,
      morningTime: '09:00',
      eveningTime: '21:00',
      eveningEnabled: false,
      softAskDismissedAt: null,
    },
    tasks: [],
    skills: [],
    skillTasks: [],
    dayTasks: [],
    workTasks: [],
    goals: [],
    transactions: [],
    expenseCategories: [],
    recurringExpenses: [],
    debts: [],
    ...over,
  }
}

const FOOD: ExpenseCategory = { id: 'food', title: 'Еда', emoji: '🍔', order: 0 }

function makeRecurring(over: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: 'r1',
    kind: 'expense',
    title: 'Аренда',
    emoji: '🏠',
    amount: 1000,
    dayOfMonth: 5,
    category: null,
    order: 0,
    createdAt: 0,
    lastChargedMonth: null,
    ...over,
  }
}

describe('категории', () => {
  it('добавляет категорию', () => {
    const r = applyAddCategory(makeState(), { title: 'Транспорт', emoji: '🚕' })
    expect(r.expenseCategories).toHaveLength(1)
    expect(r.expenseCategories[0].title).toBe('Транспорт')
    expect(r.expenseCategories[0].order).toBe(0)
  })

  it('редактирует категорию', () => {
    const r = applyEditCategory(makeState({ expenseCategories: [FOOD] }), 'food', { title: 'Питание' })
    expect(r.expenseCategories[0].title).toBe('Питание')
  })

  it('удаление сбрасывает ссылку у регулярного расхода', () => {
    const s = makeState({
      expenseCategories: [FOOD],
      recurringExpenses: [makeRecurring({ category: 'food' })],
    })
    const r = applyDeleteCategory(s, 'food')
    expect(r.expenseCategories).toHaveLength(0)
    expect(r.recurringExpenses[0].category).toBeNull()
  })
})

describe('applySpend с категорией', () => {
  it('прикрепляет валидную категорию', () => {
    const s = makeState({ balance: 5000, expenseCategories: [FOOD] })
    const { tx } = applySpend(s, 300, 'Обед', NOW, 'food')
    expect(tx.category).toBe('food')
  })

  it('несуществующую категорию отбрасывает', () => {
    const s = makeState({ balance: 5000, expenseCategories: [FOOD] })
    const { tx } = applySpend(s, 300, 'Обед', NOW, 'nope')
    expect(tx.category).toBeUndefined()
  })
})

describe('регулярные расходы', () => {
  it('добавляет с валидным днём', () => {
    const r = applyAddRecurring(
      makeState(),
      { kind: 'expense', title: 'Netflix', emoji: '🎬', amount: 500, dayOfMonth: 10, category: null },
      NOW,
    )
    expect(r.recurringExpenses).toHaveLength(1)
    expect(r.recurringExpenses[0].lastChargedMonth).toBeNull()
  })

  it('день вне диапазона 1..28 — ошибка', () => {
    expect(() =>
      applyAddRecurring(
        makeState(),
        { kind: 'expense', title: 'X', emoji: '🔁', amount: 100, dayOfMonth: 31, category: null },
        NOW,
      ),
    ).toThrow(FinanceError)
  })

  it('редактирование и удаление', () => {
    const s = makeState({ recurringExpenses: [makeRecurring()] })
    const edited = applyEditRecurring(s, 'r1', { amount: 1500 })
    expect(edited.recurringExpenses[0].amount).toBe(1500)
    const deleted = applyDeleteRecurring(s, 'r1')
    expect(deleted.recurringExpenses).toHaveLength(0)
  })
})

describe('applyChargeRecurring', () => {
  it('списывает, создаёт spend с категорией и помечает месяц', () => {
    const s = makeState({
      balance: 5000,
      expenseCategories: [FOOD],
      recurringExpenses: [makeRecurring({ amount: 1000, category: 'food' })],
    })
    const { state, tx } = applyChargeRecurring(s, 'r1', NOW)
    expect(state.balance).toBe(4000)
    expect(tx.type).toBe('spend')
    expect(tx.category).toBe('food')
    expect(state.recurringExpenses[0].lastChargedMonth).toBe(currentMonth(s, NOW))
  })

  it('повторное списание в том же месяце — ошибка', () => {
    const s = makeState({
      balance: 5000,
      recurringExpenses: [makeRecurring({ lastChargedMonth: currentMonth(makeState(), NOW) })],
    })
    expect(() => applyChargeRecurring(s, 'r1', NOW)).toThrow(FinanceError)
  })

  it('недостаточно денег — ошибка', () => {
    const s = makeState({ balance: 100, recurringExpenses: [makeRecurring({ amount: 1000 })] })
    expect(() => applyChargeRecurring(s, 'r1', NOW)).toThrow(FinanceError)
  })

  it('доход зачисляет deposit и не требует баланса', () => {
    const s = makeState({ balance: 0, recurringExpenses: [makeRecurring({ kind: 'income', amount: 3000 })] })
    const { state, tx } = applyChargeRecurring(s, 'r1', NOW)
    expect(state.balance).toBe(3000)
    expect(tx.type).toBe('deposit')
  })
})

describe('dueRecurring', () => {
  it('возвращает наступившие и несписанные', () => {
    const s = makeState({
      recurringExpenses: [
        makeRecurring({ id: 'past', dayOfMonth: 5 }), // 5 <= 28 → due
        makeRecurring({ id: 'future', dayOfMonth: 28 }), // 28 <= 28 → due
        makeRecurring({ id: 'charged', dayOfMonth: 1, lastChargedMonth: currentMonth(makeState(), NOW) }),
      ],
    })
    const due = dueRecurring(s, NOW)
    const ids = due.map((r) => r.id)
    expect(ids).toContain('past')
    expect(ids).toContain('future')
    expect(ids).not.toContain('charged')
  })
})
