import type { Transaction, ExpenseCategory } from '../types'
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
    if (tx.type === 'deposit') b.earned += tx.amount
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
    if (tx.type === 'deposit') {
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

export interface CategorySlice {
  id: string // id категории или '__none__'
  title: string
  emoji: string
  total: number
  count: number
  share: number // доля от всех трат (0..1)
}

const NONE_ID = '__none__'

/**
 * Разбивка трат (type === 'spend') по категориям, по убыванию суммы.
 * Транзакции без категории или со ссылкой на удалённую категорию идут в «Без категории».
 * sinceTimestamp — необязательный фильтр «с какого момента» (например, начало месяца).
 */
export function categoryBreakdown(
  transactions: Transaction[],
  categories: ExpenseCategory[],
  sinceTimestamp = 0,
): CategorySlice[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<string, { total: number; count: number }>()
  let grand = 0

  for (const tx of transactions) {
    if (tx.type !== 'spend') continue
    if (tx.timestamp < sinceTimestamp) continue
    const key = tx.category && byId.has(tx.category) ? tx.category : NONE_ID
    const cur = totals.get(key) ?? { total: 0, count: 0 }
    cur.total += tx.amount
    cur.count += 1
    totals.set(key, cur)
    grand += tx.amount
  }

  const slices: CategorySlice[] = []
  for (const [key, { total, count }] of totals) {
    const cat = byId.get(key)
    slices.push({
      id: key,
      title: cat?.title ?? 'Без категории',
      emoji: cat?.emoji ?? '❔',
      total,
      count,
      share: grand > 0 ? total / grand : 0,
    })
  }
  return slices.sort((a, b) => b.total - a.total)
}

export interface BudgetSlice {
  id: string
  title: string
  emoji: string
  limit: number
  spent: number
  ratio: number // потрачено / лимит
  over: boolean
}

/** Начало месяца ("YYYY-MM") как timestamp. */
export function monthStartTimestamp(month: string): number {
  return new Date(`${month}-01T00:00:00`).getTime()
}

/**
 * Статус бюджетов: для категорий с лимитом — сколько потрачено за период
 * (обычно с начала месяца), доля и факт превышения. По убыванию заполненности.
 */
export function budgetStatus(
  transactions: Transaction[],
  categories: ExpenseCategory[],
  sinceTimestamp: number,
): BudgetSlice[] {
  const withLimit = categories.filter((c) => (c.monthlyLimit ?? 0) > 0)
  if (withLimit.length === 0) return []

  const spentById = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'spend' || !tx.category) continue
    if (tx.timestamp < sinceTimestamp) continue
    spentById.set(tx.category, (spentById.get(tx.category) ?? 0) + tx.amount)
  }

  return withLimit
    .map((c) => {
      const limit = c.monthlyLimit ?? 0
      const spent = spentById.get(c.id) ?? 0
      return { id: c.id, title: c.title, emoji: c.emoji, limit, spent, ratio: spent / limit, over: spent > limit }
    })
    .sort((a, b) => b.ratio - a.ratio)
}
