import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { ExpenseCategory, RecurringExpense } from '../types'

const EMOJI_QUICK = ['🔁', '🏠', '📱', '🌐', '💡', '🚗', '🎵', '🎬', '🏋️', '💳', '🧾', '📦']

export interface RecurringFormValues {
  title: string
  emoji: string
  amount: number
  dayOfMonth: number
  category: string | null
}

interface RecurringFormProps {
  initial?: RecurringExpense
  categories: ExpenseCategory[]
  onSubmit: (values: RecurringFormValues) => void
  onDelete?: () => void
}

export function RecurringForm({ initial, categories, onSubmit, onDelete }: RecurringFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🔁')
  const [amount, setAmount] = useState<string>(initial?.amount.toString() ?? '')
  const [day, setDay] = useState<string>(initial?.dayOfMonth.toString() ?? '1')
  const [category, setCategory] = useState<string | null>(initial?.category ?? null)
  const [err, setErr] = useState<string | null>(null)

  const sorted = [...categories].sort((a, b) => a.order - b.order)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const trimmedTitle = title.trim()
    const amountNum = Number(amount)
    const dayNum = Number(day)

    if (!trimmedTitle) return setErr('Введи название')
    if (trimmedTitle.length > 80) return setErr('Название слишком длинное')
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setErr('Сумма должна быть больше 0')
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 28) return setErr('День месяца: от 1 до 28')

    onSubmit({
      title: trimmedTitle,
      emoji: emoji.trim() || '🔁',
      amount: amountNum,
      dayOfMonth: dayNum,
      category: category && sorted.some((c) => c.id === category) ? category : null,
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
          placeholder="Аренда / Подписка / Кредит"
        />
      </label>

      <div>
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Эмодзи</span>
        <div className="flex flex-wrap gap-1 items-center">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="w-14 bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-white text-xl text-center focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          />
          {EMOJI_QUICK.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-lg w-8 h-8 rounded-lg hover:bg-white/10 transition ${
                emoji === e ? 'bg-white/15 border border-[var(--color-gold)]/50' : ''
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <label className="block flex-1">
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сумма</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            min={1}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
            placeholder="0"
          />
        </label>
        <label className="block w-28">
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">День</span>
          <input
            type="number"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            inputMode="numeric"
            min={1}
            max={28}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          />
        </label>
      </div>

      {sorted.length > 0 && (
        <div>
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Категория</span>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory((prev) => (prev === c.id ? null : c.id))}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                  category === c.id
                    ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)]/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {c.emoji} {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && (
        <div className="text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition"
      >
        {initial ? 'Сохранить' : 'Добавить'}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
        >
          <Trash2 size={16} />
          Удалить
        </button>
      )}
    </form>
  )
}
