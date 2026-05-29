import { useMemo, useState } from 'react'
import { Loader2, History } from 'lucide-react'
import type { Transaction, Currency, AppState } from '../types'
import { TransactionRow } from './TransactionRow'
import { EditTransactionDialog } from './EditTransactionDialog'
import { Modal } from '../components/Modal'
import { useAppState } from '../state/AppStateContext'
import { isTransactionEditable } from '../finance/finance'
import { loadTransactions } from '../storage/storage'
import { getCurrentDay } from '../lib/dates'

interface TransactionsListProps {
  state: AppState
  userId: string
  currency: Currency
}

const PAGE_SIZE = 50

// Поступления (баланс +). Остальное считаем списаниями.
const INFLOW = new Set(['earn', 'deposit', 'collect', 'borrow', 'withdraw'])
type TxFilter = 'all' | 'in' | 'out'

export function TransactionsList({ state, userId, currency }: TransactionsListProps) {
  const { editTransaction, deleteTransaction } = useAppState()
  const [extra, setExtra] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TxFilter>('all')

  // Править/удалять можно только ручные операции (расход/пополнение), которые есть
  // в свежем срезе state (инлайн) — для них корректно откатывается баланс.
  const inlineIds = useMemo(() => new Set(state.transactions.map((t) => t.id)), [state.transactions])

  const handleEditSubmit = (patch: { amount: number; label: string; category: string | null }) => {
    if (!editing) return
    editTransaction(editing, patch)
    setExtra((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...patch, category: patch.category ?? undefined } : t)))
    setEditing(null)
  }

  const handleDelete = () => {
    if (!editing) return
    deleteTransaction(editing)
    setExtra((prev) => prev.filter((t) => t.id !== editing.id))
    setEditing(null)
  }

  const all = useMemo(() => {
    const seen = new Set<string>()
    const out: Transaction[] = []
    for (const tx of [...state.transactions, ...extra]) {
      if (seen.has(tx.id)) continue
      seen.add(tx.id)
      out.push(tx)
    }
    return out.sort((a, b) => b.timestamp - a.timestamp)
  }, [state.transactions, extra])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((tx) => {
      if (filter === 'in' && !INFLOW.has(tx.type)) return false
      if (filter === 'out' && INFLOW.has(tx.type)) return false
      if (q && !tx.label.toLowerCase().includes(q)) return false
      return true
    })
  }, [all, filter, query])

  const grouped = useMemo(
    () => groupByDay(filtered, state.timezone, state.dayResetHour),
    [filtered, state.timezone, state.dayResetHour],
  )

  const handleLoadMore = async () => {
    setLoading(true)
    setErr(null)
    try {
      const more = await loadTransactions(userId, PAGE_SIZE, all.length)
      if (more.length < PAGE_SIZE) setHasMore(false)
      setExtra((prev) => [...prev, ...more])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось загрузить')
    } finally {
      setLoading(false)
    }
  }

  if (all.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10 text-white/55">
        <History size={36} className="mb-3" />
        <p className="text-sm">Операций пока нет</p>
        <p className="text-xs mt-1">Выполняй квесты или записывай расходы</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Поиск + фильтр */}
      <div className="space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
        <div className="flex bg-black/20 rounded-xl p-1 gap-1">
          {(
            [
              ['all', 'Все'],
              ['in', 'Поступления'],
              ['out', 'Списания'],
            ] as [TxFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === key
                  ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="text-center text-sm text-white/55 py-8">Ничего не найдено</div>
      )}

      {grouped.map(([label, txs]) => (
        <div key={label}>
          <div className="text-xs uppercase tracking-wide text-white/55 font-bold mb-1 px-3">
            {label}
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-1">
            {txs.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                currency={currency}
                onEdit={
                  isTransactionEditable(tx.type) && inlineIds.has(tx.id)
                    ? () => setEditing(tx)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2 mx-3">
          {err}
        </div>
      )}

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 hover:text-white transition disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Показать раньше
        </button>
      )}
      {!hasMore && all.length > 0 && (
        <div className="text-center text-xs text-white/30 pt-2">— это всё —</div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Изменить операцию">
        {editing && (
          <EditTransactionDialog
            tx={editing}
            currency={currency}
            categories={state.expenseCategories}
            onSubmit={handleEditSubmit}
            onDelete={handleDelete}
          />
        )}
      </Modal>
    </div>
  )
}

function groupByDay(
  txs: Transaction[],
  timezone: string,
  resetHour: number,
): [string, Transaction[]][] {
  const today = getCurrentDay(new Date(), timezone, resetHour)
  const yesterday = getCurrentDay(new Date(Date.now() - 86400_000), timezone, resetHour)

  const groups = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const day = getCurrentDay(new Date(tx.timestamp), timezone, resetHour)
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day)!.push(tx)
  }

  const result: [string, Transaction[]][] = []
  for (const [day, txs] of groups) {
    const label = day === today ? 'Сегодня' : day === yesterday ? 'Вчера' : formatDayLabel(day)
    result.push([label, txs])
  }
  return result
}

function formatDayLabel(day: string): string {
  // day: "YYYY-MM-DD"
  const [, m, d] = day.split('-')
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] ?? m}`
}
