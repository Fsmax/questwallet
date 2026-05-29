import { describe, it, expect } from 'vitest'
import { convertState } from './currency'
import { FinanceError } from './finance'
import type { AppState } from '../types'

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
    goals: [],
    transactions: [],
    expenseCategories: [],
    recurringExpenses: [],
    debts: [],
    ...over,
  }
}

describe('convertState', () => {
  it('сум → USD делит по курсу и ставит 2 знака', () => {
    const s = makeState({
      currency: 'сум',
      balance: 5_000_000,
      totalEarned: 1_250_000,
      goals: [{ id: 'g', title: 'Кв', emoji: '🏠', target: 500_000_000, saved: 12_500, order: 0, createdAt: 0, completedAt: null }],
      tasks: [{ id: 't', title: 'X', emoji: '💪', xpReward: 10, doneToday: false }],
    })
    const r = convertState(s, 'USD', 12500)
    expect(r.currency).toBe('USD')
    expect(r.balance).toBe(400)
    expect(r.totalEarned).toBe(100)
    expect(r.goals[0].target).toBe(40000)
    expect(r.goals[0].saved).toBe(1)
    expect(r.tasks[0].xpReward).toBe(10) // баллы не трогаем
  })

  it('USD → сум умножает по курсу и округляет до целого', () => {
    const s = makeState({
      currency: 'USD',
      balance: 400,
      debts: [{ id: 'd', direction: 'i_owe', person: 'A', emoji: '💳', principal: 10, paid: 2.5, note: '', dueDate: null, order: 0, createdAt: 0, settledAt: null }],
      recurringExpenses: [{ id: 'r', kind: 'expense', title: 'Net', emoji: '🎬', amount: 5, dayOfMonth: 1, category: null, order: 0, createdAt: 0, lastChargedMonth: null }],
    })
    const r = convertState(s, 'сум', 12500)
    expect(r.currency).toBe('сум')
    expect(r.balance).toBe(5_000_000)
    expect(r.debts[0].principal).toBe(125_000)
    expect(r.debts[0].paid).toBe(31_250)
    expect(r.recurringExpenses[0].amount).toBe(62_500)
  })

  it('история транзакций не пересчитывается', () => {
    const s = makeState({
      currency: 'сум',
      balance: 1000,
      transactions: [{ id: 'x', type: 'spend', amount: 300, label: 'Кофе', timestamp: 1 }],
    })
    const r = convertState(s, 'USD', 12500)
    expect(r.transactions[0].amount).toBe(300)
  })

  it('та же валюта — тот же объект', () => {
    const s = makeState({ currency: 'сум' })
    expect(convertState(s, 'сум', 12500)).toBe(s)
  })

  it('некорректный курс — ошибка', () => {
    const s = makeState({ currency: 'сум' })
    expect(() => convertState(s, 'USD', 0)).toThrow(FinanceError)
    expect(() => convertState(s, 'USD', -5)).toThrow(FinanceError)
  })
})
