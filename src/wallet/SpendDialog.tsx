import { useState } from 'react'
import type { Currency, ExpenseCategory } from '../types'
import { formatMoney } from '../lib/format'

interface SpendDialogProps {
  balance: number
  currency: Currency
  categories: ExpenseCategory[]
  onSubmit: (amount: number, label: string, category?: string) => void
}

export function SpendDialog({ balance, currency, categories, onSubmit }: SpendDialogProps) {
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const sorted = [...categories].sort((a, b) => a.order - b.order)

  const pickCategory = (c: ExpenseCategory) => {
    setCategoryId((prev) => (prev === c.id ? null : c.id))
    // Если название пустое — подставим название категории как подсказку
    if (!label.trim()) setLabel(c.title)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const n = Number(amount)
    const trimmed = label.trim()
    if (!Number.isFinite(n) || n <= 0) return setErr('Сумма должна быть больше 0')
    if (n > balance) return setErr(`В кошельке: ${formatMoney(balance, currency)}`)
    if (!trimmed) return setErr('Введи название (на что потратил)')
    if (trimmed.length > 80) return setErr('Название слишком длинное')
    onSubmit(n, trimmed, categoryId ?? undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-white/60 text-center">
        В кошельке: <strong className="text-white tabular-nums">{formatMoney(balance, currency)}</strong>
      </div>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сумма</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          min={1}
          max={balance}
          autoFocus
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-4 text-white text-2xl text-center font-bold tabular-nums focus:border-[var(--color-coral)]/60 focus:outline-none transition"
          placeholder="0"
        />
      </label>

      {sorted.length > 0 && (
        <div>
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Категория</span>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCategory(c)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                  categoryId === c.id
                    ? 'bg-[var(--color-coral)]/20 border-[var(--color-coral)]/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c.emoji} {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">На что</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-coral)]/60 focus:outline-none transition"
          placeholder="Кофе"
        />
      </label>

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 bg-[var(--color-coral)] text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        Списать расход
      </button>
    </form>
  )
}
