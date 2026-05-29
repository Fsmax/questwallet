import { useState } from 'react'
import type { Currency } from '../types'
import { formatMoney } from '../lib/format'

const QUICK_LABELS = ['☕ Кофе', '🍔 Еда', '🚕 Такси', '🛒 Продукты', '💊 Аптека', '🎬 Развлечения']

interface SpendDialogProps {
  balance: number
  currency: Currency
  onSubmit: (amount: number, label: string) => void
}

export function SpendDialog({ balance, currency, onSubmit }: SpendDialogProps) {
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const n = Number(amount)
    const trimmed = label.trim()
    if (!Number.isFinite(n) || n <= 0) return setErr('Сумма должна быть больше 0')
    if (n > balance) return setErr(`В кошельке: ${formatMoney(balance, currency)}`)
    if (!trimmed) return setErr('Введи название (на что потратил)')
    if (trimmed.length > 80) return setErr('Название слишком длинное')
    onSubmit(n, trimmed)
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
        <div className="flex flex-wrap gap-1.5 mt-2">
          {QUICK_LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLabel(l)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              {l}
            </button>
          ))}
        </div>
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
