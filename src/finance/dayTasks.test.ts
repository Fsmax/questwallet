import { describe, it, expect } from 'vitest'
import {
  applyAddDayTask,
  applyEditDayTask,
  applyDeleteDayTask,
  applyCompleteDayTask,
  applyUncompleteDayTask,
  applyMarkDayTaskReminded,
} from './dayTasks'
import { FinanceError } from './finance'
import type { AppState, DayTask } from '../types'

const NOW = new Date('2026-05-28T09:00:00Z') // 14:00 Tashkent → день 2026-05-28

function makeDayTask(over: Partial<DayTask> = {}): DayTask {
  return {
    id: 'd1',
    title: 'Дело',
    emoji: '📌',
    time: null,
    reminderEnabled: false,
    done: false,
    lastRemindedDate: '',
    order: 0,
    createdAt: 0,
    ...over,
  }
}

function makeState(over: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    schemaVersion: 3,
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

describe('applyAddDayTask', () => {
  it('добавляет дело с order и done=false', () => {
    const s = makeState({ dayTasks: [makeDayTask({ id: 'd1', order: 0 })] })
    const s2 = applyAddDayTask(s, { title: 'Позвонить', emoji: '📞', time: '10:00', reminderEnabled: true }, NOW)
    expect(s2.dayTasks).toHaveLength(2)
    expect(s2.dayTasks[1].order).toBe(1)
    expect(s2.dayTasks[1].done).toBe(false)
    expect(s2.dayTasks[1].time).toBe('10:00')
    expect(s2.dayTasks[1].createdAt).toBe(NOW.getTime())
  })

  it('пустое название → ошибка', () => {
    expect(() =>
      applyAddDayTask(makeState(), { title: '  ', emoji: '📌', time: null, reminderEnabled: false }, NOW),
    ).toThrow(FinanceError)
  })

  it('некорректное время → ошибка', () => {
    expect(() =>
      applyAddDayTask(makeState(), { title: 'X', emoji: '📌', time: '25:99', reminderEnabled: false }, NOW),
    ).toThrow(FinanceError)
  })

  it('пустая строка времени → null', () => {
    const s2 = applyAddDayTask(makeState(), { title: 'X', emoji: '📌', time: '', reminderEnabled: false }, NOW)
    expect(s2.dayTasks[0].time).toBeNull()
  })
})

describe('applyEditDayTask', () => {
  it('меняет поля', () => {
    const s = makeState({ dayTasks: [makeDayTask()] })
    const s2 = applyEditDayTask(s, 'd1', { title: 'Новое', time: '08:30', reminderEnabled: true })
    expect(s2.dayTasks[0].title).toBe('Новое')
    expect(s2.dayTasks[0].time).toBe('08:30')
    expect(s2.dayTasks[0].reminderEnabled).toBe(true)
  })

  it('несуществующее дело → ошибка', () => {
    expect(() => applyEditDayTask(makeState(), 'nope', { title: 'X' })).toThrow(FinanceError)
  })

  it('некорректное время → ошибка', () => {
    const s = makeState({ dayTasks: [makeDayTask()] })
    expect(() => applyEditDayTask(s, 'd1', { time: '99:99' })).toThrow(FinanceError)
  })
})

describe('applyDeleteDayTask', () => {
  it('удаляет дело', () => {
    const s = makeState({ dayTasks: [makeDayTask({ id: 'd1' }), makeDayTask({ id: 'd2' })] })
    const s2 = applyDeleteDayTask(s, 'd1')
    expect(s2.dayTasks).toHaveLength(1)
    expect(s2.dayTasks[0].id).toBe('d2')
  })

  it('несуществующее → ошибка', () => {
    expect(() => applyDeleteDayTask(makeState(), 'nope')).toThrow(FinanceError)
  })
})

describe('applyCompleteDayTask', () => {
  it('done=true, серия двигается, без баллов/опыта/денег', () => {
    const s = makeState({
      dayTasks: [makeDayTask()],
      streak: 5,
      lastActiveDate: '2026-05-27',
      xp: 100,
      totalCompleted: 3,
      balance: 50,
    })
    const s2 = applyCompleteDayTask(s, 'd1', NOW)
    expect(s2.dayTasks[0].done).toBe(true)
    expect(s2.streak).toBe(6)
    expect(s2.streakIncrementedToday).toBe(true)
    // баллов/опыта/счётчика/денег не трогаем
    expect(s2.xp).toBe(100)
    expect(s2.totalCompleted).toBe(3)
    expect(s2.balance).toBe(50)
  })

  it('повторное выполнение → ошибка', () => {
    const s = makeState({ dayTasks: [makeDayTask({ done: true })] })
    expect(() => applyCompleteDayTask(s, 'd1', NOW)).toThrow(FinanceError)
  })

  it('несуществующее → ошибка', () => {
    expect(() => applyCompleteDayTask(makeState(), 'nope', NOW)).toThrow(FinanceError)
  })
})

describe('applyUncompleteDayTask', () => {
  it('единственная активность дня → серия откатывается', () => {
    const s = makeState({ dayTasks: [makeDayTask()], streak: 5, lastActiveDate: '2026-05-27' })
    const s2 = applyCompleteDayTask(s, 'd1', NOW)
    expect(s2.streak).toBe(6)
    const s3 = applyUncompleteDayTask(s2, 'd1')
    expect(s3.dayTasks[0].done).toBe(false)
    expect(s3.streak).toBe(5)
    expect(s3.streakIncrementedToday).toBe(false)
  })

  it('есть другое выполненное дело → серия НЕ откатывается', () => {
    const s = makeState({
      dayTasks: [makeDayTask({ id: 'd1' }), makeDayTask({ id: 'd2' })],
      lastActiveDate: '2026-05-27',
      streak: 1,
    })
    const s2 = applyCompleteDayTask(s, 'd1', NOW)
    const s3 = applyCompleteDayTask(s2, 'd2', NOW)
    expect(s3.streak).toBe(2)
    const s4 = applyUncompleteDayTask(s3, 'd2')
    expect(s4.streak).toBe(2)
  })

  it('выполненный квест держит серию при откате дела', () => {
    const s = makeState({
      tasks: [{ id: 't1', title: 'X', emoji: '⚔️', xpReward: 5, doneToday: true }],
      dayTasks: [makeDayTask({ id: 'd1', done: true })],
      streak: 1,
      streakIncrementedToday: true,
    })
    const s2 = applyUncompleteDayTask(s, 'd1')
    expect(s2.streak).toBe(1)
  })

  it('не выполненное дело → ошибка', () => {
    const s = makeState({ dayTasks: [makeDayTask()] })
    expect(() => applyUncompleteDayTask(s, 'd1')).toThrow(FinanceError)
  })
})

describe('applyMarkDayTaskReminded', () => {
  it('ставит lastRemindedDate', () => {
    const s = makeState({ dayTasks: [makeDayTask()] })
    const s2 = applyMarkDayTaskReminded(s, 'd1', '2026-05-28')
    expect(s2.dayTasks[0].lastRemindedDate).toBe('2026-05-28')
  })
})
