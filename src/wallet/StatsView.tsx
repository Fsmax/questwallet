import { useEffect, useMemo, useState } from 'react'
import { Loader2, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'
import type { AppState, Currency, Transaction } from '../types'
import { aggregateByDay, summarize, categoryBreakdown, budgetStatus, monthStartTimestamp } from '../lib/stats'
import { formatMoneyShort, formatMoney } from '../lib/format'
import { getCurrentDay } from '../lib/dates'
import { loadTransactions } from '../storage/storage'

interface StatsViewProps {
  state: AppState
  userId: string
  currency: Currency
}

const RANGE = 14

export function StatsView({ state, userId, currency }: StatsViewProps) {
  const [txs, setTxs] = useState<Transaction[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [catPeriod, setCatPeriod] = useState<'month' | 'all'>('month')

  useEffect(() => {
    let cancelled = false
    loadTransactions(userId, 1000, 0)
      .then((data) => {
        if (cancelled) return
        // Объединяем с тем что в state (на случай свежих, ещё не подгруженных)
        const seen = new Set(data.map((t) => t.id))
        const merged = [...data, ...state.transactions.filter((t) => !seen.has(t.id))]
        setErr(null)
        setTxs(merged)
      })
      .catch((e) => {
        if (cancelled) return
        // Фолбэк на то что есть в state
        setTxs(state.transactions)
        setErr(e instanceof Error ? e.message : 'Не удалось загрузить полную историю')
      })
    return () => {
      cancelled = true
    }
  }, [userId, state.transactions])

  const buckets = useMemo(
    () => (txs ? aggregateByDay(txs, RANGE, state.timezone, state.dayResetHour, new Date()) : []),
    [txs, state.timezone, state.dayResetHour],
  )
  const summary = useMemo(
    () => (txs ? summarize(txs, state.timezone, state.dayResetHour) : null),
    [txs, state.timezone, state.dayResetHour],
  )
  const monthStart = useMemo(
    () => monthStartTimestamp(getCurrentDay(new Date(), state.timezone, state.dayResetHour).slice(0, 7)),
    [state.timezone, state.dayResetHour],
  )
  const categories = useMemo(
    () => (txs ? categoryBreakdown(txs, state.expenseCategories, catPeriod === 'month' ? monthStart : 0) : []),
    [txs, state.expenseCategories, catPeriod, monthStart],
  )
  const budgets = useMemo(
    () => (txs ? budgetStatus(txs, state.expenseCategories, monthStart) : []),
    [txs, state.expenseCategories, monthStart],
  )

  if (!txs || !summary) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[var(--color-gold)]" size={28} />
      </div>
    )
  }

  const maxVal = Math.max(1, ...buckets.map((b) => Math.max(b.earned, b.spent)))

  return (
    <div className="space-y-4">
      {err && (
        <div className="text-xs text-white/40 text-center">Показано по доступным данным</div>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          icon={<TrendingUp size={16} className="text-[var(--color-emerald-quest)]" />}
          label="Пополнения"
          value={formatMoneyShort(summary.totalEarned, currency)}
          color="text-[var(--color-emerald-quest)]"
        />
        <SummaryCard
          icon={<TrendingDown size={16} className="text-[var(--color-coral)]" />}
          label="Потрачено"
          value={formatMoneyShort(summary.totalSpent, currency)}
          color="text-[var(--color-coral)]"
        />
        <SummaryCard
          icon={<PiggyBank size={16} className="text-[var(--color-gold)]" />}
          label="Отложено"
          value={formatMoneyShort(summary.totalSaved, currency)}
          color="text-[var(--color-gold)]"
        />
      </div>

      <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
        <div className="text-xs text-white/50">Средний доход в активный день</div>
        <div className="font-[family-name:var(--font-display)] text-xl font-bold text-white tabular-nums">
          {formatMoney(summary.avgEarnedPerActiveDay, currency)}
        </div>
        <div className="text-xs text-white/40 mt-0.5">
          Активных дней: {summary.activeDays}
        </div>
      </div>

      {/* График по дням */}
      <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Доходы и расходы</h3>
          <span className="text-xs text-white/40">{RANGE} дней</span>
        </div>
        <div className="flex items-end justify-between gap-1 h-32">
          {buckets.map((b) => (
            <div key={b.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="w-full flex items-end justify-center gap-0.5 h-28">
                <div
                  className="w-1/2 max-w-2.5 rounded-t bg-[var(--color-emerald-quest)] transition-all"
                  style={{ height: `${(b.earned / maxVal) * 100}%` }}
                  title={`Доход: ${formatMoney(b.earned, currency)}`}
                />
                <div
                  className="w-1/2 max-w-2.5 rounded-t bg-[var(--color-coral)] transition-all"
                  style={{ height: `${(b.spent / maxVal) * 100}%` }}
                  title={`Расход: ${formatMoney(b.spent, currency)}`}
                />
              </div>
              <span className="text-[8px] text-white/30 tabular-nums rotate-0 truncate w-full text-center">
                {b.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-white/50">
            <span className="w-2.5 h-2.5 rounded bg-[var(--color-emerald-quest)]" /> доход
          </span>
          <span className="flex items-center gap-1.5 text-white/50">
            <span className="w-2.5 h-2.5 rounded bg-[var(--color-coral)]" /> расход
          </span>
        </div>
      </div>

      {/* Бюджеты на месяц */}
      {budgets.length > 0 && (
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-3">Бюджеты (этот месяц)</h3>
          <div className="space-y-2.5">
            {budgets.map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/80 truncate">
                    {b.emoji} {b.title}
                  </span>
                  <span
                    className={`font-bold tabular-nums ml-2 ${
                      b.over ? 'text-[var(--color-coral)]' : 'text-white/70'
                    }`}
                  >
                    {formatMoneyShort(b.spent, currency)} / {formatMoneyShort(b.limit, currency)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      b.over ? 'bg-[var(--color-coral)]' : 'bg-[var(--color-emerald-quest)]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, b.ratio * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Расходы по категориям */}
      {categories.length > 0 && (
        <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Куда уходят деньги</h3>
            <div className="flex bg-black/20 rounded-lg p-0.5 gap-0.5">
              {(
                [
                  ['month', 'Месяц'],
                  ['all', 'Всё время'],
                ] as ['month' | 'all', string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCatPeriod(key)}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                    catPeriod === key
                      ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            {categories.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/80 truncate">
                    {c.emoji} {c.title}
                    <span className="text-white/30 ml-1.5 text-xs tabular-nums">{c.count}</span>
                  </span>
                  <span className="text-white font-bold tabular-nums ml-2">
                    {formatMoneyShort(c.total, currency)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-coral)]"
                    style={{ width: `${Math.max(2, c.share * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={`font-bold tabular-nums text-sm ${color}`}>{value}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  )
}
