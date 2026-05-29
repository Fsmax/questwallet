import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useAppState } from '../state/AppStateContext'
import type { Currency } from '../types'
import { formatMoney } from '../lib/format'
import { SettingsCard, SettingsRow } from './SettingsCard'

const DEFAULT_RATE = 12500 // сум за 1 доллар (примерно), пользователь правит

export function CurrencySwitch() {
  const { state, convertCurrency } = useAppState()
  const [pending, setPending] = useState<Currency | null>(null)
  const [rate, setRate] = useState(String(DEFAULT_RATE))

  if (!state) return null

  const handleClick = (c: Currency) => {
    if (c === state.currency) return
    setRate(String(DEFAULT_RATE))
    setPending(c)
  }

  const rateNum = Number(rate)
  const rateValid = Number.isFinite(rateNum) && rateNum > 0

  // Предпросмотр конвертации текущего баланса
  const previewBalance = rateValid
    ? pending === 'USD'
      ? Math.round((state.balance / rateNum) * 100) / 100
      : Math.round(state.balance * rateNum)
    : 0

  const confirm = () => {
    if (pending && rateValid) convertCurrency(pending, rateNum)
    setPending(null)
  }

  return (
    <>
      <SettingsCard title="Валюта">
        <SettingsRow label="Валюта кошелька" hint="При смене все суммы пересчитываются по курсу">
          <div className="flex bg-black/30 rounded-xl p-1 gap-1">
            {(['сум', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => handleClick(c)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                  state.currency === c
                    ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {c === 'сум' ? 'сум' : '$'}
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>

      <Modal open={pending !== null} onClose={() => setPending(null)} title="Сменить валюту?">
        <div className="space-y-4">
          <p className="text-sm text-white/80">
            Все суммы (баланс, цели, долги, регулярные расходы, награды) пересчитаются по курсу.
            История операций останется в прежних числах.
          </p>

          <label className="block">
            <span className="text-sm text-white/70 font-semibold mb-1.5 block">Курс: 1 $ = … сум</span>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="numeric"
              min={1}
              autoFocus
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white text-lg text-center font-bold tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
            />
          </label>

          <div className="bg-black/30 rounded-xl p-3 text-sm">
            <div className="text-white/50">Баланс сейчас:</div>
            <div className="text-white font-bold tabular-nums">
              {formatMoney(state.balance, state.currency)}
            </div>
            <div className="text-white/50 mt-2">Станет:</div>
            <div className="text-[var(--color-gold)] font-bold tabular-nums">
              {rateValid ? formatMoney(previewBalance, pending ?? state.currency) : '—'}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPending(null)}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10"
            >
              Отмена
            </button>
            <button
              onClick={confirm}
              disabled={!rateValid}
              className="flex-1 py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Пересчитать
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
