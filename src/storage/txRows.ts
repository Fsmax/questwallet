import type { Transaction } from '../types'

/** Строка журнала транзакций в БД (snake_case как в Postgres-таблице transactions). */
export interface TransactionRow {
  id: string
  user_id: string
  type: Transaction['type']
  amount: number
  label: string
  category: string | null
  created_at: string
}

const VALID_TX_TYPES = new Set<Transaction['type']>([
  'earn', 'spend', 'save', 'withdraw', 'lend', 'collect', 'borrow', 'settle', 'deposit',
])

/**
 * Можно ли восстановить значение как транзакцию журнала. Данные приходят из
 * пользовательского JSON-бэкапа, поэтому проверяем тип/сумму/дату — один битый
 * элемент не должен завалить весь импорт.
 */
export function isImportableTransaction(t: unknown): t is Transaction {
  if (!t || typeof t !== 'object') return false
  const tx = t as Partial<Transaction>
  return (
    typeof tx.id === 'string' &&
    tx.id.length > 0 &&
    typeof tx.type === 'string' &&
    VALID_TX_TYPES.has(tx.type as Transaction['type']) &&
    typeof tx.amount === 'number' &&
    Number.isFinite(tx.amount) &&
    tx.amount > 0 &&
    typeof tx.label === 'string' &&
    typeof tx.timestamp === 'number' &&
    Number.isFinite(tx.timestamp)
  )
}

/**
 * Преобразовать транзакции из бэкапа в строки журнала, отбросив битые.
 * Чистая функция (без сети): оригинальные даты переносятся в created_at, иначе
 * статистика по дням «съехала» бы на сегодня. category по умолчанию null.
 */
export function buildTransactionRows(
  userId: string,
  txs: readonly unknown[],
): TransactionRow[] {
  return txs.filter(isImportableTransaction).map((t) => ({
    id: t.id,
    user_id: userId,
    type: t.type,
    amount: t.amount,
    label: t.label,
    category: t.category ?? null,
    created_at: new Date(t.timestamp).toISOString(),
  }))
}
