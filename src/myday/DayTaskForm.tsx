import { useState } from 'react'
import { Trash2, Bell } from 'lucide-react'
import type { DayTask } from '../types'
import { Toggle } from '../settings/Toggle'

const EMOJI_QUICK = ['☀️', '🏃', '🍳', '💧', '📖', '💼', '🧹', '🛒', '📞', '🧘', '🌙', '📝', '💊', '🚿', '⏰']

export interface DayTaskFormValues {
  title: string
  emoji: string
  time: string | null
  reminderEnabled: boolean
}

interface DayTaskFormProps {
  initial?: DayTask
  onSubmit: (values: DayTaskFormValues) => void
  onDelete?: () => void
}

export function DayTaskForm({ initial, onSubmit, onDelete }: DayTaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📌')
  const [time, setTime] = useState<string>(initial?.time ?? '')
  const [reminderEnabled, setReminderEnabled] = useState(initial?.reminderEnabled ?? false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const trimmedTitle = title.trim()
    const trimmedEmoji = emoji.trim()

    if (!trimmedTitle) return setErr('Введи название')
    if (trimmedTitle.length > 80) return setErr('Название слишком длинное')
    if (!trimmedEmoji) return setErr('Выбери эмодзи')
    // Напоминание без времени смысла не имеет
    const cleanTime = time.trim() || null
    if (reminderEnabled && !cleanTime) return setErr('Для напоминания укажи время')

    onSubmit({ title: trimmedTitle, emoji: trimmedEmoji, time: cleanTime, reminderEnabled })
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
          placeholder="Позвонить маме"
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
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Время (необязательно)</span>
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
          <Bell size={16} className="text-[var(--color-gold)]" />
          Напоминание
        </span>
        <Toggle
          on={reminderEnabled}
          onToggle={() => setReminderEnabled((v) => !v)}
          label="Напоминание"
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
        {initial ? 'Сохранить' : 'Добавить дело'}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
        >
          <Trash2 size={16} />
          Удалить дело
        </button>
      )}
    </form>
  )
}
