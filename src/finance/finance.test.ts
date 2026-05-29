import { describe, it, expect } from 'vitest'
import {
  applyEarn,
  applyCancel,
  applySave,
  applyWithdraw,
  applySpend,
  applyDeleteGoal,
  applyDeleteTask,
  applyEditGoal,
  applyEditTask,
  applyAddTask,
  applyAddGoal,
  FinanceError,
} from './finance'
import type { AppState, Task, Goal } from '../types'

const NOW = new Date('2026-05-28T09:00:00Z')

function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Зарядка',
    emoji: '💪',
    reward: 200,
    xpReward: 10,
    doneToday: false,
    ...over,
  }
}

function makeGoal(over: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    title: 'Квартира',
    emoji: '🏠',
    target: 10_000,
    saved: 0,
    order: 0,
    createdAt: 0,
    completedAt: null,
    ...over,
  }
}

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
    ...over,
  }
}

describe('applyEarn', () => {
  it('happy path: начисляет деньги, XP, streak, doneToday=true', () => {
    const s = makeState({ tasks: [makeTask({ reward: 200, xpReward: 10 })] })
    const { state, tx } = applyEarn(s, 't1', NOW)

    expect(state.balance).toBe(200)
    expect(state.totalEarned).toBe(200)
    expect(state.xp).toBe(10)
    expect(state.streak).toBe(1)
    expect(state.streakIncrementedToday).toBe(true)
    expect(state.tasks[0].doneToday).toBe(true)
    expect(state.transactions).toHaveLength(1)
    expect(state.transactions[0].type).toBe('earn')
    expect(state.transactions[0].amount).toBe(200)
    expect(tx.id).toBeTruthy()
    expect(tx.id).toBe(state.transactions[0].id)
  })

  it('двойное выполнение → ошибка', () => {
    const s = makeState({ tasks: [makeTask({ doneToday: true })] })
    expect(() => applyEarn(s, 't1', NOW)).toThrow(FinanceError)
  })

  it('несуществующий task → ошибка', () => {
    const s = makeState({ tasks: [makeTask()] })
    expect(() => applyEarn(s, 'unknown', NOW)).toThrow(FinanceError)
  })

  it('второе задание в тот же день не дублирует streak', () => {
    const s1 = makeState({
      tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' })],
    })
    const { state: s2 } = applyEarn(s1, 't1', NOW)
    const { state: s3 } = applyEarn(s2, 't2', NOW)
    expect(s3.streak).toBe(1)
  })
})

describe('applyCancel', () => {
  it('откат денег, XP, doneToday=false', () => {
    const s1 = makeState({ tasks: [makeTask({ reward: 200, xpReward: 10 })] })
    const { state: s2 } = applyEarn(s1, 't1', NOW)
    const { state: s3 } = applyCancel(s2, 't1')
    expect(s3.balance).toBe(0)
    expect(s3.totalEarned).toBe(0)
    expect(s3.xp).toBe(0)
    expect(s3.tasks[0].doneToday).toBe(false)
  })

  it('откат единственного задания дня → streak откатывается', () => {
    const s1 = makeState({
      tasks: [makeTask()],
      streak: 5,
      lastActiveDate: '2026-05-27',
    })
    const { state: s2 } = applyEarn(s1, 't1', NOW)
    expect(s2.streak).toBe(6)
    const { state: s3 } = applyCancel(s2, 't1')
    expect(s3.streak).toBe(5)
    expect(s3.streakIncrementedToday).toBe(false)
  })

  it('откат, если есть другие выполненные сегодня → streak НЕ трогаем', () => {
    const s1 = makeState({
      tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' })],
    })
    const { state: s2 } = applyEarn(s1, 't1', NOW)
    const { state: s3 } = applyEarn(s2, 't2', NOW)
    expect(s3.streak).toBe(1)
    const { state: s4 } = applyCancel(s3, 't2')
    expect(s4.streak).toBe(1)
  })

  it('отмена невыполненного → ошибка', () => {
    const s = makeState({ tasks: [makeTask({ doneToday: false })] })
    expect(() => applyCancel(s, 't1')).toThrow(FinanceError)
  })
})

describe('applySave', () => {
  it('happy path: balance -= amount, goal.saved += amount', () => {
    const s = makeState({ balance: 1000, goals: [makeGoal()] })
    const { state, tx } = applySave(s, 'g1', 300, NOW)
    expect(state.balance).toBe(700)
    expect(state.goals[0].saved).toBe(300)
    expect(tx.type).toBe('save')
  })

  it('попытка отложить больше чем в кошельке → ошибка', () => {
    const s = makeState({ balance: 100, goals: [makeGoal()] })
    expect(() => applySave(s, 'g1', 500, NOW)).toThrow(FinanceError)
  })

  it('отрицательная сумма → ошибка', () => {
    const s = makeState({ balance: 1000, goals: [makeGoal()] })
    expect(() => applySave(s, 'g1', -100, NOW)).toThrow(FinanceError)
  })

  it('достижение цели → completedAt выставляется', () => {
    const s = makeState({ balance: 10_000, goals: [makeGoal({ target: 500 })] })
    const { state } = applySave(s, 'g1', 500, NOW)
    expect(state.goals[0].completedAt).toBe(NOW.getTime())
  })

  it('повторное превышение не перезаписывает completedAt', () => {
    const earlier = NOW.getTime() - 86400_000
    const s = makeState({
      balance: 10_000,
      goals: [makeGoal({ target: 500, saved: 500, completedAt: earlier })],
    })
    const { state } = applySave(s, 'g1', 100, NOW)
    expect(state.goals[0].completedAt).toBe(earlier)
  })
})

describe('applyWithdraw', () => {
  it('happy path: deposit обратно в кошелёк', () => {
    const s = makeState({ balance: 0, goals: [makeGoal({ saved: 500 })] })
    const { state } = applyWithdraw(s, 'g1', 200, NOW)
    expect(state.balance).toBe(200)
    expect(state.goals[0].saved).toBe(300)
  })

  it('снятие больше чем есть на цели → ошибка', () => {
    const s = makeState({ goals: [makeGoal({ saved: 100 })] })
    expect(() => applyWithdraw(s, 'g1', 500, NOW)).toThrow(FinanceError)
  })

  it('снятие до уровня ниже target → completedAt → null', () => {
    const s = makeState({
      goals: [makeGoal({ target: 500, saved: 500, completedAt: 12345 })],
    })
    const { state } = applyWithdraw(s, 'g1', 100, NOW)
    expect(state.goals[0].completedAt).toBeNull()
  })
})

describe('applySpend', () => {
  it('happy path', () => {
    const s = makeState({ balance: 1000 })
    const { state, tx } = applySpend(s, 200, 'Кофе', NOW)
    expect(state.balance).toBe(800)
    expect(tx.type).toBe('spend')
    expect(tx.label).toBe('Кофе')
  })

  it('расход больше кошелька → ошибка', () => {
    const s = makeState({ balance: 100 })
    expect(() => applySpend(s, 500, 'X', NOW)).toThrow(FinanceError)
  })

  it('пустой label → ошибка', () => {
    const s = makeState({ balance: 1000 })
    expect(() => applySpend(s, 100, '   ', NOW)).toThrow(FinanceError)
  })

  it('label trim применяется', () => {
    const s = makeState({ balance: 1000 })
    const { tx } = applySpend(s, 100, '  Обед  ', NOW)
    expect(tx.label).toBe('Обед')
  })
})

describe('applyDeleteGoal', () => {
  it('пустая цель (saved=0) удаляется без транзакции', () => {
    const s = makeState({ goals: [makeGoal({ saved: 0 })] })
    const r = applyDeleteGoal(s, 'g1', 'return_to_wallet', NOW)
    expect(r.state.goals).toHaveLength(0)
    expect(r.tx).toBeNull()
  })

  it('return_to_wallet: saved → balance', () => {
    const s = makeState({ balance: 0, goals: [makeGoal({ saved: 500 })] })
    const r = applyDeleteGoal(s, 'g1', 'return_to_wallet', NOW)
    expect(r.state.balance).toBe(500)
    expect(r.state.goals).toHaveLength(0)
    expect(r.tx?.type).toBe('withdraw')
  })

  it('discard: деньги списываются, типа spend', () => {
    const s = makeState({ balance: 0, goals: [makeGoal({ saved: 500 })] })
    const r = applyDeleteGoal(s, 'g1', 'discard', NOW)
    expect(r.state.balance).toBe(0)
    expect(r.state.goals).toHaveLength(0)
    expect(r.tx?.type).toBe('spend')
  })
})

describe('applyDeleteTask', () => {
  it('задание удаляется, деньги в балансе остаются', () => {
    const s = makeState({
      balance: 200,
      tasks: [makeTask({ doneToday: true })],
    })
    const s2 = applyDeleteTask(s, 't1')
    expect(s2.tasks).toHaveLength(0)
    expect(s2.balance).toBe(200)
  })
})

describe('applyEditGoal', () => {
  it('меняем target ниже saved → автозавершение', () => {
    const s = makeState({
      goals: [makeGoal({ target: 1000, saved: 800, completedAt: null })],
    })
    const s2 = applyEditGoal(s, 'g1', { target: 500 }, NOW)
    expect(s2.goals[0].completedAt).toBe(NOW.getTime())
  })

  it('меняем target выше saved для выполненной → снова активна', () => {
    const s = makeState({
      goals: [makeGoal({ target: 500, saved: 500, completedAt: 12345 })],
    })
    const s2 = applyEditGoal(s, 'g1', { target: 1000 }, NOW)
    expect(s2.goals[0].completedAt).toBeNull()
  })
})

describe('applyEditTask', () => {
  it('меняем reward — баланс не пересчитывается', () => {
    const s = makeState({
      balance: 200,
      tasks: [makeTask({ reward: 200, doneToday: true })],
    })
    const s2 = applyEditTask(s, 't1', { reward: 500 })
    expect(s2.balance).toBe(200)
    expect(s2.tasks[0].reward).toBe(500)
  })
})

describe('applyAddTask / applyAddGoal', () => {
  it('добавление задания', () => {
    const s = makeState()
    const s2 = applyAddTask(s, { title: 'Новое', emoji: '⭐', reward: 100, xpReward: 5 })
    expect(s2.tasks).toHaveLength(1)
    expect(s2.tasks[0].id).toBeTruthy()
    expect(s2.tasks[0].doneToday).toBe(false)
  })

  it('добавление цели — order инкрементируется', () => {
    const s = makeState({ goals: [makeGoal({ id: 'g1', order: 0 })] })
    const s2 = applyAddGoal(
      s,
      { title: 'Новая', emoji: '🎯', target: 1000 },
      NOW,
    )
    expect(s2.goals).toHaveLength(2)
    expect(s2.goals[1].order).toBe(1)
    expect(s2.goals[1].saved).toBe(0)
  })

  it('добавление с невалидными данными → ошибка', () => {
    const s = makeState()
    expect(() =>
      applyAddTask(s, { title: '', emoji: '⭐', reward: 100, xpReward: 5 }),
    ).toThrow(FinanceError)
    expect(() =>
      applyAddTask(s, { title: 'OK', emoji: '⭐', reward: -10, xpReward: 5 }),
    ).toThrow(FinanceError)
  })
})
