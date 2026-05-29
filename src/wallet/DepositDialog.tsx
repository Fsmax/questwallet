import { useState } from 'react'
import type { Currency } from '../types'

interface DepositDialogProps {
  currency: Currency
  onSubmit: (amount: number, label?: string) => void
}

export function DepositDialog({ onSubmit }: DepositDialogProps) {
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return setErr('Сумма должна быть больше 0')
    if (n > 1_000_000_000) return setErr('Слишком большая сумма')
    if (label.trim().length > 80) return setErr('Название слишком длинное')
    onSubmit(n, label.trim() || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-white/60 text-center">
        Внеси деньги, которые у тебя уже есть — баланс кошелька увеличится.
      </p>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сумма</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          min={1}
          autoFocus
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-4 text-white text-2xl text-center font-bold tabular-nums focus:border-[var(--color-emerald-quest)]/60 focus:outline-none transition"
          placeholder="0"
        />
      </label>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Заметка (необязательно)</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-emerald-quest)]/60 focus:outline-none transition"
          placeholder="Наличные / Зарплата / Перевод"
        />
      </label>

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        Пополнить
      </button>
    </form>
  )
}
