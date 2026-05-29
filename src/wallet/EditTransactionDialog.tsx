import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Currency, ExpenseCategory, Transaction } from '../types'

interface EditTransactionDialogProps {
  tx: Transaction
  currency: Currency
  categories: ExpenseCategory[]
  onSubmit: (patch: { amount: number; label: string; category: string | null }) => void
  onDelete: () => void
}

export function EditTransactionDialog({
  tx,
  categories,
  onSubmit,
  onDelete,
}: EditTransactionDialogProps) {
  const [amount, setAmount] = useState(String(tx.amount))
  const [label, setLabel] = useState(tx.label)
  const [categoryId, setCategoryId] = useState<string | null>(tx.category ?? null)
  const [err, setErr] = useState<string | null>(null)

  const isSpend = tx.type === 'spend'
  const sorted = [...categories].sort((a, b) => a.order - b.order)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const n = Number(amount)
    const trimmed = label.trim()
    if (!Number.isFinite(n) || n <= 0) return setErr('Сумма должна быть больше 0')
    if (!trimmed) return setErr('Введи название')
    if (trimmed.length > 80) return setErr('Название слишком длинное')
    onSubmit({ amount: n, label: trimmed, category: isSpend ? categoryId : null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сумма</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          min={1}
          autoFocus
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-4 text-white text-2xl text-center font-bold tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
      </label>

      {isSpend && sorted.length > 0 && (
        <div>
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Категория</span>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId((prev) => (prev === c.id ? null : c.id))}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                  categoryId === c.id
                    ? 'bg-[var(--color-coral)]/20 border-[var(--color-coral)]/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {c.emoji} {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Название</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
      </label>

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        Сохранить
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
      >
        <Trash2 size={16} />
        Удалить операцию
      </button>
    </form>
  )
}
