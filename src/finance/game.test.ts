import { describe, it, expect } from 'vitest'
import {
  totalXpForLevel,
  calcLevel,
  tickStreak,
  visibleStreak,
  dailyResetIfNeeded,
} from './game'
import type { AppState } from '../types'

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    schemaVersion: 1,
    timezone: 'Asia/Tashkent',
    dayResetHour: 4,
    currency: 'сум',
    balance: 0,
    totalEarned: 0,
    xp: 0,
    streak: 0,
    streakIncrementedToday: false,
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
    ...overrides,
  }
}

describe('totalXpForLevel', () => {
  it('level 1 = 0 xp нужно', () => {
    expect(totalXpForLevel(1)).toBe(0)
  })

  it('level 2 = 100 xp', () => {
    expect(totalXpForLevel(2)).toBe(100)
  })

  it('level 3 = 225 xp (100 + 125)', () => {
    expect(totalXpForLevel(3)).toBe(225)
  })

  it('погрешность не растёт на больших уровнях', () => {
    // На уровне 50 разница должна быть стабильной геометрической прогрессией
    const a = totalXpForLevel(50)
    const b = totalXpForLevel(51)
    const diff = b - a
    // на уровне 51 нужно 100 * 1.25^49 за один уровень
    const expected = Math.round(100 * Math.pow(1.25, 49))
    expect(Math.abs(diff - expected)).toBeLessThan(2)
  })
})

describe('calcLevel', () => {
  it('0 xp → level 1, прогресс 0', () => {
    const r = calcLevel(0)
    expect(r.level).toBe(1)
    expect(r.rem).toBe(0)
    expect(r.need).toBe(100)
  })

  it('99 xp → level 1, почти готов', () => {
    const r = calcLevel(99)
    expect(r.level).toBe(1)
    expect(r.rem).toBe(99)
  })

  it('100 xp → level 2', () => {
    const r = calcLevel(100)
    expect(r.level).toBe(2)
    expect(r.rem).toBe(0)
    expect(r.need).toBe(125)
  })

  it('224 xp → level 2, до 3-го осталось 1', () => {
    const r = calcLevel(224)
    expect(r.level).toBe(2)
    expect(r.rem).toBe(124)
    expect(r.need).toBe(125)
  })

  it('225 xp → level 3', () => {
    const r = calcLevel(225)
    expect(r.level).toBe(3)
  })
})

describe('tickStreak', () => {
  const now = new Date('2026-05-28T09:00:00Z') // 14:00 Tashkent → день 2026-05-28

  it('первое задание у нового пользователя → streak = 1', () => {
    const state = makeState({ streak: 0, lastActiveDate: '' })
    const r = tickStreak(state, now)
    expect(r.streak).toBe(1)
    expect(r.lastActiveDate).toBe('2026-05-28')
    expect(r.incremented).toBe(true)
  })

  it('вчера была активность → streak += 1', () => {
    const state = makeState({ streak: 5, lastActiveDate: '2026-05-27' })
    const r = tickStreak(state, now)
    expect(r.streak).toBe(6)
    expect(r.incremented).toBe(true)
  })

  it('сегодня уже отмечал → ничего не меняется', () => {
    const state = makeState({ streak: 5, lastActiveDate: '2026-05-28' })
    const r = tickStreak(state, now)
    expect(r.streak).toBe(5)
    expect(r.incremented).toBe(false)
  })

  it('пропустил день → streak = 1 (с нуля)', () => {
    const state = makeState({ streak: 10, lastActiveDate: '2026-05-25' })
    const r = tickStreak(state, now)
    expect(r.streak).toBe(1)
    expect(r.incremented).toBe(true)
  })
})

describe('visibleStreak', () => {
  const now = new Date('2026-05-28T09:00:00Z')

  it('активность сегодня → видим streak', () => {
    const state = makeState({ streak: 7, lastActiveDate: '2026-05-28' })
    expect(visibleStreak(state, now)).toBe(7)
  })

  it('активность вчера → ещё видим', () => {
    const state = makeState({ streak: 7, lastActiveDate: '2026-05-27' })
    expect(visibleStreak(state, now)).toBe(7)
  })

  it('пропустил → 0, серия прервана', () => {
    const state = makeState({ streak: 7, lastActiveDate: '2026-05-26' })
    expect(visibleStreak(state, now)).toBe(0)
  })
})

describe('dailyResetIfNeeded', () => {
  const now = new Date('2026-05-28T09:00:00Z')

  it('день не поменялся → state не трогаем', () => {
    const state = makeState({
      lastResetDate: '2026-05-28',
      tasks: [{ id: '1', title: 'a', emoji: '⚔️', reward: 10, xpReward: 10, doneToday: true }],
    })
    const r = dailyResetIfNeeded(state, now)
    expect(r).toBe(state)
  })

  it('новый день → все doneToday в false, lastResetDate обновлён', () => {
    const state = makeState({
      lastResetDate: '2026-05-27',
      streakIncrementedToday: true,
      tasks: [
        { id: '1', title: 'a', emoji: '⚔️', reward: 10, xpReward: 10, doneToday: true },
        { id: '2', title: 'b', emoji: '⚔️', reward: 20, xpReward: 10, doneToday: false },
      ],
    })
    const r = dailyResetIfNeeded(state, now)
    expect(r.lastResetDate).toBe('2026-05-28')
    expect(r.streakIncrementedToday).toBe(false)
    expect(r.tasks.every((t) => !t.doneToday)).toBe(true)
  })

  it('новый день → skillTasks тоже сбрасываются', () => {
    const state = makeState({
      lastResetDate: '2026-05-27',
      skillTasks: [
        { id: 'st1', skillId: 's1', title: 'A', emoji: '⭐', reward: 10, xpReward: 5, doneToday: true },
        { id: 'st2', skillId: 's1', title: 'B', emoji: '⭐', reward: 10, xpReward: 5, doneToday: true },
      ],
    })
    const r = dailyResetIfNeeded(state, now)
    expect(r.skillTasks.every((t) => !t.doneToday)).toBe(true)
  })
})
