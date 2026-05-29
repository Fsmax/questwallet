import type { Transaction } from '../types'
import { getCurrentDay } from './dates'

export interface DayBucket {
  day: string // YYYY-MM-DD
  label: string // "28.05"
  earned: number
  spent: number
}

export interface StatsSummary {
  totalEarned: number
  totalSpent: number
  totalSaved: number
  avgEarnedPerActiveDay: number
  activeDays: number
}

/**
 * Группирует транзакции по дням за последние N дней (в таймзоне пользователя).
 * Возвращает массив от старого к новому, включая пустые дни.
 */
export function aggregateByDay(
  transactions: Transaction[],
  days: number,
  timezone: string,
  resetHour: number,
  now: Date,
): DayBucket[] {
  const buckets = new Map<string, DayBucket>()

  // Инициализируем последние N дней (включая сегодня) пустыми
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000)
    const day = getCurrentDay(d, timezone, resetHour)
    buckets.set(day, { day, label: dayLabel(day), earned: 0, spent: 0 })
  }

  for (const tx of transactions) {
    const day = getCurrentDay(new Date(tx.timestamp), timezone, resetHour)
    const b = buckets.get(day)
    if (!b) continue // вне окна
    if (tx.type === 'earn') b.earned += tx.amount
    else if (tx.type === 'spend') b.spent += tx.amount
  }

  return Array.from(buckets.values())
}

export function summarize(transactions: Transaction[]): StatsSummary {
  let totalEarned = 0
  let totalSpent = 0
  let totalSaved = 0
  const earnDays = new Set<string>()

  for (const tx of transactions) {
    if (tx.type === 'earn') {
      totalEarned += tx.amount
      earnDays.add(new Date(tx.timestamp).toISOString().slice(0, 10))
    } else if (tx.type === 'spend') {
      totalSpent += tx.amount
    } else if (tx.type === 'save') {
      totalSaved += tx.amount
    }
  }

  const activeDays = earnDays.size
  return {
    totalEarned,
    totalSpent,
    totalSaved,
    activeDays,
    avgEarnedPerActiveDay: activeDays > 0 ? Math.round(totalEarned / activeDays) : 0,
  }
}

function dayLabel(day: string): string {
  const [, m, d] = day.split('-')
  return `${d}.${m}`
}
