import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Debt, DebtDirection } from '../types'

const EMOJI_QUICK = ['🤝', '💳', '👤', '💰', '🏦', '💵', '🧾', '🎁', '🚗', '🏠', '📱', '🍽️']

export interface DebtFormValues {
  direction: DebtDirection
  person: string
  emoji: string
  principal: number
  note: string
  dueDate: string | null
}

interface DebtFormProps {
  initial?: Debt
  onSubmit: (values: DebtFormValues) => void
  onDelete?: () => void
}

export function DebtForm({ initial, onSubmit, onDelete }: DebtFormProps) {
  const [direction, setDirection] = useState<DebtDirection>(initial?.direction ?? 'owed_to_me')
  const [person, setPerson] = useState(initial?.person ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🤝')
  const [principal, setPrincipal] = useState<string>(initial?.principal.toString() ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? '')
  const [err, setErr] = useState<string | null>(null)

  const isEdit = !!initial

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const trimmedPerson = person.trim()
    const trimmedEmoji = emoji.trim()
    const principalNum = Number(principal)

    if (!trimmedPerson) return setErr('Введи имя')
    if (trimmedPerson.length > 80) return setErr('Имя слишком длинное')
    if (!trimmedEmoji) return setErr('Выбери эмодзи')
    if (!Number.isFinite(principalNum) || principalNum <= 0) return setErr('Сумма должна быть больше 0')
    if (principalNum > 1_000_000_000) return setErr('Слишком большая сумма')

    onSubmit({
      direction,
      person: trimmedPerson,
      emoji: trimmedEmoji,
      principal: principalNum,
      note: note.trim(),
      dueDate: dueDate || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div>
          <span className="text-sm text-white/70 font-semibold mb-1.5 block">Тип</span>
          <div className="flex bg-black/30 rounded-xl p-1 gap-1">
            <DirButton active={direction === 'owed_to_me'} onClick={() => setDirection('owed_to_me')}>
              🤝 Мне должны
            </DirButton>
            <DirButton active={direction === 'i_owe'} onClick={() => setDirection('i_owe')}>
              💳 Я должен
            </DirButton>
          </div>
          <p className="text-xs text-white/55 mt-1.5">
            {direction === 'owed_to_me'
              ? 'Сумма спишется с кошелька (ты даёшь в долг).'
              : 'Сумма добавится в кошелёк (ты берёшь в долг).'}
          </p>
        </div>
      )}

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Кто</span>
        <input
          type="text"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          maxLength={80}
          autoFocus
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="Имя"
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
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Сумма</span>
        <input
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          inputMode="numeric"
          min={1}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="0"
        />
        {isEdit && (
          <p className="text-xs text-white/55 mt-1">
            Правка суммы не двигает баланс — деньги меняются только при погашении.
          </p>
        )}
      </label>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Срок (необязательно)</span>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
      </label>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">Заметка (необязательно)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
          placeholder="За что / детали"
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
        {isEdit ? 'Сохранить' : 'Добавить долг'}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
        >
          <Trash2 size={16} />
          Удалить долг
        </button>
      )}
    </form>
  )
}

function DirButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
        active ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]' : 'text-white/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
