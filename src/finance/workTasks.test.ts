import { describe, it, expect } from 'vitest'
import {
  applyAddWorkTask,
  applyEditWorkTask,
  applyDeleteWorkTask,
  applyCompleteWorkTask,
  applyUncompleteWorkTask,
} from './workTasks'
import { dailyResetIfNeeded } from './game'
import { FinanceError } from './finance'
import type { AppState, WorkTask } from '../types'

const NOW = new Date('2026-05-28T09:00:00Z') // день 2026-05-28 (Asia/Tashkent, reset 4)

function makeWorkTask(over: Partial<WorkTask> = {}): WorkTask {
  return {
    id: 'w1',
    title: 'Смена',
    emoji: '💼',
    amount: 100,
    showInMyDay: true,
    time: null,
    doneToday: false,
    lastEarnTxId: null,
    order: 0,
    createdAt: 0,
    ...over,
  }
}

function makeState(over: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    schemaVersion: 4,
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

describe('applyAddWorkTask', () => {
  it('добавляет таск с order и doneToday=false', () => {
    const s = applyAddWorkTask(
      makeState(),
      { title: 'Заказ', emoji: '💻', amount: 500, showInMyDay: true, time: '10:00' },
      NOW,
    )
    expect(s.workTasks).toHaveLength(1)
    expect(s.workTasks[0]).toMatchObject({
      title: 'Заказ',
      amount: 500,
      showInMyDay: true,
      time: '10:00',
      doneToday: false,
      lastEarnTxId: null,
    })
  })

  it('сумма <= 0 → ошибка', () => {
    expect(() =>
      applyAddWorkTask(makeState(), { title: 'X', emoji: '💼', amount: 0, showInMyDay: false, time: null }, NOW),
    ).toThrow(FinanceError)
  })

  it('некорректное время → ошибка', () => {
    expect(() =>
      applyAddWorkTask(makeState(), { title: 'X', emoji: '💼', amount: 10, showInMyDay: false, time: '99:99' }, NOW),
    ).toThrow(FinanceError)
  })
})

describe('applyCompleteWorkTask', () => {
  it('начисляет деньги в кошелёк и создаёт deposit-транзакцию', () => {
    const s = makeState({ balance: 50, workTasks: [makeWorkTask({ amount: 200 })] })
    const { state, tx } = applyCompleteWorkTask(s, 'w1', NOW)
    expect(state.balance).toBe(250)
    expect(state.workTasks[0].doneToday).toBe(true)
    expect(state.workTasks[0].lastEarnTxId).toBe(tx.id)
    expect(tx.type).toBe('deposit')
    expect(tx.amount).toBe(200)
    expect(tx.label).toBe('Работа: Смена')
    expect(state.transactions[0].id).toBe(tx.id)
  })

  it('не трогает XP и серию', () => {
    const s = makeState({ xp: 30, streak: 4, workTasks: [makeWorkTask()] })
    const { state } = applyCompleteWorkTask(s, 'w1', NOW)
    expect(state.xp).toBe(30)
    expect(state.streak).toBe(4)
  })

  it('повторное выполнение в тот же день → ошибка', () => {
    const s = makeState({ workTasks: [makeWorkTask({ doneToday: true })] })
    expect(() => applyCompleteWorkTask(s, 'w1', NOW)).toThrow(FinanceError)
  })
})

describe('applyUncompleteWorkTask', () => {
  it('откатывает баланс и удаляет транзакцию заработка', () => {
    const s = makeState({ balance: 50, workTasks: [makeWorkTask({ amount: 200 })] })
    const { state: done } = applyCompleteWorkTask(s, 'w1', NOW)
    const txId = done.workTasks[0].lastEarnTxId
    const { state, removedTxId } = applyUncompleteWorkTask(done, 'w1')
    expect(state.balance).toBe(50)
    expect(state.workTasks[0].doneToday).toBe(false)
    expect(state.workTasks[0].lastEarnTxId).toBe(null)
    expect(removedTxId).toBe(txId)
    expect(state.transactions.find((t) => t.id === txId)).toBeUndefined()
  })

  it('снятие невыполненного → ошибка', () => {
    const s = makeState({ workTasks: [makeWorkTask({ doneToday: false })] })
    expect(() => applyUncompleteWorkTask(s, 'w1')).toThrow(FinanceError)
  })
})

describe('applyEditWorkTask / applyDeleteWorkTask', () => {
  it('правит сумму и название', () => {
    const s = makeState({ workTasks: [makeWorkTask()] })
    const next = applyEditWorkTask(s, 'w1', { amount: 999, title: 'Подработка' })
    expect(next.workTasks[0].amount).toBe(999)
    expect(next.workTasks[0].title).toBe('Подработка')
  })

  it('удаляет таск, прошлый заработок (баланс) не трогает', () => {
    const s = makeState({ balance: 300, workTasks: [makeWorkTask()] })
    const next = applyDeleteWorkTask(s, 'w1')
    expect(next.workTasks).toHaveLength(0)
    expect(next.balance).toBe(300)
  })

  it('правка несуществующего → ошибка', () => {
    expect(() => applyEditWorkTask(makeState(), 'nope', { amount: 1 })).toThrow(FinanceError)
  })
})

describe('dailyResetIfNeeded для рабочих тасков', () => {
  it('сбрасывает doneToday и lastEarnTxId, но баланс сохраняет', () => {
    const s = makeState({
      balance: 500,
      lastResetDate: '2026-05-27',
      workTasks: [makeWorkTask({ doneToday: true, lastEarnTxId: 'tx-1' })],
    })
    const next = dailyResetIfNeeded(s, NOW)
    expect(next.workTasks[0].doneToday).toBe(false)
    expect(next.workTasks[0].lastEarnTxId).toBe(null)
    expect(next.balance).toBe(500)
  })
})
