import { describe, it, expect } from 'vitest'
import { computeAchievements, newlyUnlocked, getMetricValue } from './compute'
import { totalXpForLevel } from '../finance/game'
import type { AppState } from '../types'

function makeState(over: Partial<AppState> = {}): AppState {
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
    goals: [],
    transactions: [],
    expenseCategories: [],
    recurringExpenses: [],
    debts: [],
    ...over,
  }
}

describe('getMetricValue', () => {
  it('completed', () => {
    expect(getMetricValue(makeState({ totalCompleted: 42 }), 'completed')).toBe(42)
  })
  it('level из xp', () => {
    // 225 xp = уровень 3
    expect(getMetricValue(makeState({ xp: 225 }), 'level')).toBe(3)
  })
  it('goals считает только завершённые', () => {
    const s = makeState({
      goals: [
        { id: 'g1', title: 'a', emoji: '🎯', target: 100, saved: 100, order: 0, createdAt: 0, completedAt: 1 },
        { id: 'g2', title: 'b', emoji: '🎯', target: 100, saved: 50, order: 1, createdAt: 0, completedAt: null },
      ],
    })
    expect(getMetricValue(s, 'goals')).toBe(1)
  })
  it('skillLevel — максимальный уровень среди навыков', () => {
    const s = makeState({
      skills: [
        { id: 's1', title: 'A', emoji: '💻', xp: 0, order: 0, createdAt: 0 },
        { id: 's2', title: 'B', emoji: '🇬🇧', xp: totalXpForLevel(6), order: 1, createdAt: 0 },
      ],
    })
    expect(getMetricValue(s, 'skillLevel')).toBe(6)
  })
})

describe('computeAchievements', () => {
  it('новый пользователь — ничего не выполнено', () => {
    const views = computeAchievements(makeState())
    expect(views.every((v) => !v.conditionMet)).toBe(true)
    expect(views.every((v) => !v.unlocked)).toBe(true)
  })

  it('10 выполнений → quests_10 conditionMet', () => {
    const views = computeAchievements(makeState({ totalCompleted: 10 }))
    const q10 = views.find((v) => v.def.id === 'quests_10')!
    expect(q10.conditionMet).toBe(true)
    expect(q10.progress).toBe(1)
  })

  it('progress считается корректно', () => {
    const views = computeAchievements(makeState({ totalCompleted: 5 }))
    const q10 = views.find((v) => v.def.id === 'quests_10')!
    expect(q10.progress).toBe(0.5)
    expect(q10.conditionMet).toBe(false)
  })

  it('unlocked отражает state.unlockedAchievements', () => {
    const views = computeAchievements(makeState({ unlockedAchievements: ['streak_3'] }))
    const s3 = views.find((v) => v.def.id === 'streak_3')!
    expect(s3.unlocked).toBe(true)
  })
})

describe('newlyUnlocked', () => {
  it('возвращает выполненные но ещё не разблокированные', () => {
    const s = makeState({ streak: 7, totalCompleted: 10 })
    const fresh = newlyUnlocked(s)
    expect(fresh).toContain('streak_3')
    expect(fresh).toContain('streak_7')
    expect(fresh).toContain('quests_10')
    expect(fresh).not.toContain('streak_30')
  })

  it('не возвращает уже разблокированные', () => {
    const s = makeState({ streak: 7, unlockedAchievements: ['streak_3', 'streak_7'] })
    const fresh = newlyUnlocked(s)
    expect(fresh).not.toContain('streak_3')
    expect(fresh).not.toContain('streak_7')
  })

  it('пустой массив если ничего нового', () => {
    expect(newlyUnlocked(makeState())).toEqual([])
  })
})
