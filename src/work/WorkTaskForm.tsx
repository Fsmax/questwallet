import { useState } from 'react'
import { Trash2, CalendarCheck } from 'lucide-react'
import type { WorkTask } from '../types'
import { Toggle } from '../settings/Toggle'

const EMOJI_QUICK = ['💼', '💻', '📊', '📞', '✉️', '🛠️', '🚚', '🧾', '🏗️', '🎨', '📦', '🧹', '🍳', '✂️', '📸']

export interface WorkTaskFormValues {
  title: string
  emoji: string
  amount: number
  showInMyDay: boolean
  time: string | null
}

interface WorkTaskFormProps {
  initial?: WorkTask
  onSubmit: (values: WorkTaskFormValues) => void
  onDelete?: () => void
}

export function WorkTaskForm({ initial, onSubmit, onDelete }: WorkTaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💼')
  const [amount, setAmount] = useState<string>(initial ? initial.amount.toString() : '')
  const [showInMyDay, setShowInMyDay] = useState(initial?.showInMyDay ?? true)
  const [time, setTime] = useState<string>(initial?.time ?? '')
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const trimmedTitle = title.trim()
    const trimmedEmoji = emoji.trim()
    const amountNum = Number(amount)

    if (!trimmedTitle) return setErr('Введи название')
    if (trimmedTitle.length > 80) return setErr('Название слишком длинное')
    if (!trimmedEmoji) return setErr('Выбери эмодзи')
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setErr('Сумма должна быть больше 0')

    onSubmit({
      title: trimmedTitle,
      emoji: trimmedEmoji,
      amount: amountNum,
      showInMyDay,
      time: time.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Название</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          autoFocus
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="Смена / Заказ / Подработка"
        />
      </label>

      <div>
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Эмодзи</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="w-16 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white text-2xl text-center focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          />
          <div className="flex-1 flex flex-wrap gap-1 items-center">
            {EMOJI_QUICK.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`text-xl w-9 h-9 rounded-lg hover:bg-white/10 transition ${
                  emoji === e ? 'bg-white/15 border border-[var(--color-gold)]/50' : ''
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Заработок за выполнение</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          min={1}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="0"
        />
        <span className="text-xs text-white/40 mt-1 block">
          При выполнении эта сумма зачисляется в кошелёк.
        </span>
      </label>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Время в «Мой день» (необязательно)</span>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition [color-scheme:dark]"
          />
          {time && (
            <button
              type="button"
              onClick={() => setTime('')}
              className="px-3 py-3 text-sm text-white/50 hover:text-white/80 rounded-xl hover:bg-white/5 transition"
            >
              Сброс
            </button>
          )}
        </div>
      </label>

      <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-3">
        <span className="flex items-center gap-2 text-sm text-white/80 font-semibold">
          <CalendarCheck size={16} className="text-[var(--color-gold)]" />
          Показывать в «Мой день»
        </span>
        <Toggle
          on={showInMyDay}
          onToggle={() => setShowInMyDay((v) => !v)}
          label="Показывать в Мой день"
        />
      </div>

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        {initial ? 'Сохранить' : 'Добавить таск'}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
        >
          <Trash2 size={16} />
          Удалить таск
        </button>
      )}
    </form>
  )
}
