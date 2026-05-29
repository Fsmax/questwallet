import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Goal } from '../types'

const EMOJI_QUICK = ['🏠', '🚗', '✈️', '💍', '🎓', '💻', '📱', '🎸', '🏝️', '🎁', '👶', '🐶', '🌳', '🎯', '⭐']

export interface GoalFormValues {
  title: string
  emoji: string
  target: number
}

interface GoalFormProps {
  initial?: Goal
  onSubmit: (values: GoalFormValues) => void
  onDelete?: () => void
}

export function GoalForm({ initial, onSubmit, onDelete }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎯')
  const [target, setTarget] = useState<string>(initial?.target.toString() ?? '1000000')
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const trimmedTitle = title.trim()
    const trimmedEmoji = emoji.trim()
    const targetNum = Number(target)

    if (!trimmedTitle) return setErr('Введи название')
    if (trimmedTitle.length > 80) return setErr('Название слишком длинное')
    if (!trimmedEmoji) return setErr('Выбери эмодзи')
    if (!Number.isFinite(targetNum) || targetNum <= 0) return setErr('Цель должна быть больше 0')
    if (targetNum > 1_000_000_000) return setErr('Слишком большая сумма')

    onSubmit({ title: trimmedTitle, emoji: trimmedEmoji, target: targetNum })
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
          placeholder="Квартира"
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
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сколько нужно накопить</span>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          inputMode="numeric"
          min={1}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
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
        {initial ? 'Сохранить' : 'Создать цель'}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
        >
          <Trash2 size={16} />
          Удалить цель
        </button>
      )}
    </form>
  )
}
