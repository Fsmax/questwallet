import { describe, it, expect } from 'vitest'
import { ensureDefaults } from './ensureDefaults'
import type { AppState } from '../types'

function rawState(over: Record<string, unknown> = {}): AppState {
  return {
    version: 1,
    schemaVersion: 1,
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
    expenseCategories: [{ id: 'c1', title: 'Еда', emoji: '🍔', order: 0 }],
    recurringExpenses: [],
    debts: [],
    ...over,
  } as AppState
}

describe('ensureDefaults', () => {
  it('full state — без изменений (тот же объект)', () => {
    const s = rawState()
    expect(ensureDefaults(s)).toBe(s)
  })

  it('добавляет reminders если отсутствует', () => {
    const s = rawState({ reminders: undefined })
    const r = ensureDefaults(s)
    expect(r.reminders).toBeDefined()
    expect(r.reminders.enabled).toBe(false)
    expect(r.reminders.morningTime).toBe('09:00')
  })

  it('заполняет частично заданный reminders', () => {
    const partial = { enabled: true } as Partial<AppState['reminders']>
    const s = rawState({ reminders: partial })
    const r = ensureDefaults(s)
    expect(r.reminders.enabled).toBe(true)
    expect(r.reminders.morningTime).toBe('09:00')
    expect(r.reminders.eveningEnabled).toBe(false)
  })

  it('добавляет dayResetHour=4 если undefined', () => {
    const s = rawState({ dayResetHour: undefined })
    const r = ensureDefaults(s)
    expect(r.dayResetHour).toBe(4)
  })

  it('добавляет timezone если пустая', () => {
    const s = rawState({ timezone: '' })
    const r = ensureDefaults(s)
    expect(r.timezone).toBeTruthy()
  })

  it('добавляет lastNotifiedDate если отсутствует', () => {
    const s = rawState({ lastNotifiedDate: undefined })
    const r = ensureDefaults(s)
    expect(r.lastNotifiedDate).toEqual({ morning: '', evening: '' })
  })

  it('добавляет dayTasks=[] если отсутствует', () => {
    const s = rawState({ dayTasks: undefined })
    const r = ensureDefaults(s)
    expect(Array.isArray(r.dayTasks)).toBe(true)
    expect(r.dayTasks).toHaveLength(0)
  })
})
