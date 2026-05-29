import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useAppState } from '../state/AppStateContext'
import type { Currency } from '../types'
import { SettingsCard, SettingsRow } from './SettingsCard'

export function CurrencySwitch() {
  const { state, setCurrency } = useAppState()
  const [pending, setPending] = useState<Currency | null>(null)

  if (!state) return null

  const handleClick = (c: Currency) => {
    if (c === state.currency) return
    setPending(c)
  }

  const confirm = () => {
    if (pending) setCurrency(pending)
    setPending(null)
  }

  return (
    <>
      <SettingsCard title="Валюта">
        <SettingsRow label="Отображение сумм" hint="Это только символ — числа не пересчитываются">
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

      <Modal open={pending !== null} onClose={() => setPending(null)} title="Поменять валюту?">
        <div className="space-y-4">
          <p className="text-sm text-white/80">
            Числа останутся теми же. Изменится только символ.
          </p>
          <div className="bg-black/30 rounded-xl p-3 text-sm">
            <div className="text-white/50">Сейчас:</div>
            <div className="text-white font-bold tabular-nums">
              100 000 {state.currency === 'сум' ? 'сум' : '$'}
            </div>
            <div className="text-white/50 mt-2">Станет:</div>
            <div className="text-[var(--color-gold)] font-bold tabular-nums">
              {pending === 'USD' ? '$100 000.00' : '100 000 сум'}
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
              className="flex-1 py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl"
            >
              Поменять
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
