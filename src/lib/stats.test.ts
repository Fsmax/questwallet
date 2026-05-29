import { describe, it, expect } from 'vitest'
import { aggregateByDay, summarize } from './stats'
import type { Transaction } from '../types'

const TZ = 'Asia/Tashkent'
const NOW = new Date('2026-05-28T09:00:00Z') // 14:00 Tashkent → день 2026-05-28

function tx(over: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36),
    type: 'earn',
    amount: 100,
    label: 'x',
    timestamp: NOW.getTime(),
    ...over,
  }
}

describe('aggregateByDay', () => {
  it('возвращает ровно N дней', () => {
    const result = aggregateByDay([], 7, TZ, 4, NOW)
    expect(result).toHaveLength(7)
  })

  it('последний день — сегодня', () => {
    const result = aggregateByDay([], 7, TZ, 4, NOW)
    expect(result[result.length - 1].day).toBe('2026-05-28')
  })

  it('суммирует earn и spend по дням', () => {
    const txs = [
      tx({ type: 'earn', amount: 200 }),
      tx({ type: 'earn', amount: 300 }),
      tx({ type: 'spend', amount: 150 }),
    ]
    const result = aggregateByDay(txs, 7, TZ, 4, NOW)
    const today = result[result.length - 1]
    expect(today.earned).toBe(500)
    expect(today.spent).toBe(150)
  })

  it('транзакции вне окна игнорируются', () => {
    const old = tx({ type: 'earn', amount: 999, timestamp: new Date('2020-01-01T00:00:00Z').getTime() })
    const result = aggregateByDay([old], 7, TZ, 4, NOW)
    const totalEarned = result.reduce((s, b) => s + b.earned, 0)
    expect(totalEarned).toBe(0)
  })

  it('save/withdraw не идут в earned/spent', () => {
    const txs = [tx({ type: 'save', amount: 1000 }), tx({ type: 'withdraw', amount: 500 })]
    const result = aggregateByDay(txs, 7, TZ, 4, NOW)
    const today = result[result.length - 1]
    expect(today.earned).toBe(0)
    expect(today.spent).toBe(0)
  })
})

describe('summarize', () => {
  it('считает суммы по типам', () => {
    const txs = [
      tx({ type: 'earn', amount: 200 }),
      tx({ type: 'earn', amount: 300 }),
      tx({ type: 'spend', amount: 100 }),
      tx({ type: 'save', amount: 400 }),
      tx({ type: 'withdraw', amount: 50 }),
    ]
    const s = summarize(txs)
    expect(s.totalEarned).toBe(500)
    expect(s.totalSpent).toBe(100)
    expect(s.totalSaved).toBe(400)
  })

  it('средний заработок за активный день', () => {
    const txs = [
      tx({ type: 'earn', amount: 200, timestamp: new Date('2026-05-27T10:00:00Z').getTime() }),
      tx({ type: 'earn', amount: 400, timestamp: new Date('2026-05-28T10:00:00Z').getTime() }),
    ]
    const s = summarize(txs)
    expect(s.activeDays).toBe(2)
    expect(s.avgEarnedPerActiveDay).toBe(300)
  })

  it('пустой список', () => {
    const s = summarize([])
    expect(s.totalEarned).toBe(0)
    expect(s.avgEarnedPerActiveDay).toBe(0)
    expect(s.activeDays).toBe(0)
  })
})
