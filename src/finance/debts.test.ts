import { describe, it, expect } from 'vitest'
import {
  applyAddDebt,
  applyRepayDebt,
  applyEditDebt,
  applyDeleteDebt,
  debtRemaining,
  debtTotals,
} from './debts'
import { FinanceError } from './finance'
import type { AppState, Debt } from '../types'

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

function makeDebt(over: Partial<Debt> = {}): Debt {
  return {
    id: 'd1',
    direction: 'owed_to_me',
    person: 'Алишер',
    emoji: '🤝',
    principal: 1000,
    paid: 0,
    note: '',
    dueDate: null,
    order: 0,
    createdAt: 0,
    settledAt: null,
    ...over,
  }
}

describe('applyAddDebt', () => {
  it('owed_to_me: списывает с баланса и создаёт tx lend', () => {
    const s = makeState({ balance: 5000 })
    const { state, tx } = applyAddDebt(
      s,
      { direction: 'owed_to_me', person: 'Алишер', emoji: '🤝', principal: 1000, note: '', dueDate: null },
      NOW,
    )
    expect(state.balance).toBe(4000)
    expect(state.debts).toHaveLength(1)
    expect(state.debts[0].principal).toBe(1000)
    expect(state.debts[0].paid).toBe(0)
    expect(tx.type).toBe('lend')
    expect(tx.amount).toBe(1000)
  })

  it('owed_to_me: нельзя дать в долг больше, чем есть', () => {
    const s = makeState({ balance: 500 })
    expect(() =>
      applyAddDebt(
        s,
        { direction: 'owed_to_me', person: 'X', emoji: '🤝', principal: 1000, note: '', dueDate: null },
        NOW,
      ),
    ).toThrow(FinanceError)
  })

  it('i_owe: добавляет к балансу и создаёт tx borrow', () => {
    const s = makeState({ balance: 100 })
    const { state, tx } = applyAddDebt(
      s,
      { direction: 'i_owe', person: 'Банк', emoji: '🏦', principal: 2000, note: '', dueDate: null },
      NOW,
    )
    expect(state.balance).toBe(2100)
    expect(tx.type).toBe('borrow')
    expect(state.debts[0].direction).toBe('i_owe')
  })

  it('пустое имя — ошибка', () => {
    expect(() =>
      applyAddDebt(
        makeState({ balance: 5000 }),
        { direction: 'owed_to_me', person: '  ', emoji: '🤝', principal: 100, note: '', dueDate: null },
        NOW,
      ),
    ).toThrow(FinanceError)
  })
})

describe('applyRepayDebt', () => {
  it('owed_to_me: возврат добавляет к балансу и копит paid', () => {
    const s = makeState({ balance: 0, debts: [makeDebt({ principal: 1000 })] })
    const { state, tx } = applyRepayDebt(s, 'd1', 400, NOW)
    expect(state.balance).toBe(400)
    expect(state.debts[0].paid).toBe(400)
    expect(state.debts[0].settledAt).toBeNull()
    expect(tx.type).toBe('collect')
  })

  it('owed_to_me: полный возврат закрывает долг', () => {
    const s = makeState({ balance: 0, debts: [makeDebt({ principal: 1000, paid: 600 })] })
    const { state } = applyRepayDebt(s, 'd1', 400, NOW)
    expect(state.debts[0].paid).toBe(1000)
    expect(state.debts[0].settledAt).toBe(NOW.getTime())
    expect(debtRemaining(state.debts[0])).toBe(0)
  })

  it('i_owe: погашение списывает с баланса, tx settle', () => {
    const s = makeState({ balance: 5000, debts: [makeDebt({ direction: 'i_owe', principal: 2000 })] })
    const { state, tx } = applyRepayDebt(s, 'd1', 2000, NOW)
    expect(state.balance).toBe(3000)
    expect(state.debts[0].settledAt).toBe(NOW.getTime())
    expect(tx.type).toBe('settle')
  })

  it('i_owe: нельзя отдать больше, чем есть в кошельке', () => {
    const s = makeState({ balance: 100, debts: [makeDebt({ direction: 'i_owe', principal: 2000 })] })
    expect(() => applyRepayDebt(s, 'd1', 500, NOW)).toThrow(FinanceError)
  })

  it('нельзя погасить больше остатка', () => {
    const s = makeState({ balance: 9999, debts: [makeDebt({ principal: 1000, paid: 900 })] })
    expect(() => applyRepayDebt(s, 'd1', 200, NOW)).toThrow(FinanceError)
  })

  it('погашение уже закрытого долга — ошибка', () => {
    const s = makeState({ balance: 9999, debts: [makeDebt({ principal: 1000, paid: 1000 })] })
    expect(() => applyRepayDebt(s, 'd1', 1, NOW)).toThrow(FinanceError)
  })
})

describe('applyEditDebt', () => {
  it('снижение суммы до paid закрывает долг', () => {
    const s = makeState({ debts: [makeDebt({ principal: 1000, paid: 500 })] })
    const r = applyEditDebt(s, 'd1', { principal: 500 }, NOW)
    expect(r.debts[0].settledAt).toBe(NOW.getTime())
  })

  it('повышение суммы переоткрывает закрытый долг', () => {
    const s = makeState({ debts: [makeDebt({ principal: 500, paid: 500, settledAt: 123 })] })
    const r = applyEditDebt(s, 'd1', { principal: 1000 }, NOW)
    expect(r.debts[0].settledAt).toBeNull()
  })

  it('правка не двигает баланс', () => {
    const s = makeState({ balance: 777, debts: [makeDebt()] })
    const r = applyEditDebt(s, 'd1', { person: 'Новое имя', principal: 5000 }, NOW)
    expect(r.balance).toBe(777)
    expect(r.debts[0].person).toBe('Новое имя')
  })
})

describe('applyDeleteDebt', () => {
  it('удаляет долг, баланс не трогает', () => {
    const s = makeState({ balance: 100, debts: [makeDebt()] })
    const r = applyDeleteDebt(s, 'd1')
    expect(r.debts).toHaveLength(0)
    expect(r.balance).toBe(100)
  })
})

describe('debtTotals', () => {
  it('считает остатки по направлениям, игнорируя закрытые', () => {
    const debts = [
      makeDebt({ id: 'a', direction: 'owed_to_me', principal: 1000, paid: 200 }), // rem 800
      makeDebt({ id: 'b', direction: 'i_owe', principal: 500, paid: 0 }), // rem 500
      makeDebt({ id: 'c', direction: 'owed_to_me', principal: 300, paid: 300 }), // settled
    ]
    const t = debtTotals(debts)
    expect(t.owedToMe).toBe(800)
    expect(t.iOwe).toBe(500)
    expect(t.net).toBe(300)
  })
})
