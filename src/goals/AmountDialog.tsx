import { useState } from 'react'
import type { Currency } from '../types'
import { formatMoney } from '../lib/format'

interface AmountDialogProps {
  max: number
  currency: Currency
  ctaLabel: string
  ctaColor: 'gold' | 'emerald' | 'coral'
  hint?: string
  onSubmit: (amount: number) => void
}

export function AmountDialog({ max, currency, ctaLabel, ctaColor, hint, onSubmit }: AmountDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [err, setErr] = useState<string | null>(null)

  const setPercent = (pct: number) => {
    const v = Math.floor(max * pct)
    setAmount(String(v))
    setErr(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return setErr('Сумма должна быть больше 0')
    if (n > max) return setErr(`Доступно: ${formatMoney(max, currency)}`)
    onSubmit(n)
  }

  const ctaClass =
    ctaColor === 'gold'
      ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]'
      : ctaColor === 'emerald'
        ? 'bg-[var(--color-emerald-quest)] text-[var(--color-bg-deep)]'
        : 'bg-[var(--color-coral)] text-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-white/60 text-center">
        Доступно: <strong className="text-white tabular-nums">{formatMoney(max, currency)}</strong>
      </div>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сумма</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          min={1}
          max={max}
          autoFocus
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-4 text-white text-2xl text-center font-bold tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="0"
        />
      </label>

      <div className="flex gap-2">
        {[0.25, 0.5, 1].map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setPercent(pct)}
            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 hover:text-white transition"
          >
            {pct === 1 ? 'Всё' : `${Math.round(pct * 100)}%`}
          </button>
        ))}
      </div>

      {hint && <div className="text-xs text-white/55 text-center">{hint}</div>}

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        className={`w-full py-3 font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition ${ctaClass}`}
      >
        {ctaLabel}
      </button>
    </form>
  )
}
