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

export function TransactionsList({ state, userId, currency }: TransactionsListProps) {
  const { editTransaction, deleteTransaction } = useAppState()
  const [extra, setExtra] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)

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

  const grouped = useMemo(() => groupByDay(all, state.timezone, state.dayResetHour), [all, state.timezone, state.dayResetHour])

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
      <div className="flex flex-col items-center text-center py-10 text-white/40">
        <History size={36} className="mb-3" />
        <p className="text-sm">Операций пока нет</p>
        <p className="text-xs mt-1">Выполняй квесты или записывай расходы</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(([label, txs]) => (
        <div key={label}>
          <div className="text-xs uppercase tracking-wide text-white/40 font-bold mb-1 px-3">
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
