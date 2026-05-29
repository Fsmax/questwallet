import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { Modal } from '../components/Modal'
import { SettingsCard } from './SettingsCard'

const CONFIRM_PHRASE = 'СБРОС'

export function DangerSection() {
  const { factoryReset } = useAppState()
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (phrase !== CONFIRM_PHRASE) return
    setBusy(true)
    setErr(null)
    try {
      await factoryReset()
      setOpen(false)
      setPhrase('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сбросить')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsCard title="Опасная зона">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-coral)]/15 border border-[var(--color-coral)]/30 text-[var(--color-coral)] font-semibold rounded-xl hover:bg-[var(--color-coral)]/20 transition"
      >
        <Trash2 size={16} />
        Полный сброс прогресса
      </button>
      <p className="text-xs text-white/40 mt-2">
        Удалит весь прогресс, историю транзакций и вернёт seed-данные.
      </p>

      <Modal
        open={open}
        onClose={() => {
          if (!busy) {
            setOpen(false)
            setPhrase('')
            setErr(null)
          }
        }}
        title="Полный сброс"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-xl">
            <AlertTriangle className="text-[var(--color-coral)] flex-shrink-0" size={20} />
            <div className="text-sm text-white/90">
              Будет удалено всё: баланс, XP, серия, квесты, цели. Это <strong>необратимо</strong>.
            </div>
          </div>
          <label className="block">
            <span className="text-sm text-white/70 font-semibold mb-1.5 block">
              Чтобы подтвердить, введи: <strong className="text-[var(--color-coral)]">{CONFIRM_PHRASE}</strong>
            </span>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value.toUpperCase())}
              autoFocus
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-coral)]/60 focus:outline-none transition"
            />
          </label>
          {err && (
            <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={phrase !== CONFIRM_PHRASE || busy}
            className="w-full py-3 bg-[var(--color-coral)] text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            {busy ? 'Сбрасываем…' : 'Подтвердить сброс'}
          </button>
        </div>
      </Modal>
    </SettingsCard>
  )
}
