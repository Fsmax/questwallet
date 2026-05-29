import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Task } from '../types'

const EMOJI_QUICK = ['💪', '📖', '🧘', '💧', '📵', '🌱', '🛌', '📝', '🏃', '🎨', '🎓', '💼', '🍎', '☀️', '⭐']

export interface QuestFormValues {
  title: string
  emoji: string
  reward: number
  xpReward: number
}

interface QuestFormProps {
  initial?: Task
  onSubmit: (values: QuestFormValues) => void
  onDelete?: () => void
  submitLabel?: string
}

export function QuestForm({ initial, onSubmit, onDelete, submitLabel }: QuestFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '⭐')
  const [reward, setReward] = useState<string>(initial?.reward.toString() ?? '200')
  const [xpReward, setXpReward] = useState<string>(initial?.xpReward.toString() ?? '10')
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const trimmedTitle = title.trim()
    const trimmedEmoji = emoji.trim()
    const rewardNum = Number(reward)
    const xpNum = Number(xpReward)

    if (!trimmedTitle) return setErr('Введи название')
    if (trimmedTitle.length > 80) return setErr('Название слишком длинное')
    if (!trimmedEmoji) return setErr('Выбери эмодзи')
    if (!Number.isFinite(rewardNum) || rewardNum <= 0) return setErr('Награда должна быть больше 0')
    if (rewardNum > 1_000_000_000) return setErr('Слишком большая сумма')
    if (!Number.isFinite(xpNum) || xpNum < 0 || xpNum > 1000) return setErr('XP от 0 до 1000')

    onSubmit({ title: trimmedTitle, emoji: trimmedEmoji, reward: rewardNum, xpReward: xpNum })
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
          placeholder="Утренняя зарядка"
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

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Награда</span>
          <input
            type="number"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            inputMode="numeric"
            min={1}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          />
        </label>
        <label className="block">
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Опыт (XP)</span>
          <input
            type="number"
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            inputMode="numeric"
            min={0}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          />
        </label>
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
        {submitLabel ?? (initial ? 'Сохранить' : 'Создать квест')}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
        >
          <Trash2 size={16} />
          Удалить квест
        </button>
      )}
    </form>
  )
}
