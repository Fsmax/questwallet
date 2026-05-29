import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useConfirm } from '../components/ConfirmProvider'
import { SettingsCard } from './SettingsCard'
import { Modal } from '../components/Modal'
import { formatMoney } from '../lib/format'
import type { ExpenseCategory } from '../types'

export function CategoriesSection() {
  const { state, addCategory, editCategory, deleteCategory } = useAppState()
  const confirm = useConfirm()
  const [newEmoji, setNewEmoji] = useState('📦')
  const [newTitle, setNewTitle] = useState('')
  const [editing, setEditing] = useState<ExpenseCategory | null>(null)

  if (!state) return null

  const list = [...state.expenseCategories].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    const t = newTitle.trim()
    if (!t) return
    addCategory({ title: t, emoji: newEmoji.trim() || '📦' })
    setNewTitle('')
    setNewEmoji('📦')
  }

  return (
    <SettingsCard title="Категории и бюджеты">
      <div className="space-y-1 mb-3">
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => setEditing(c)}
            className="w-full flex items-center gap-3 py-2 text-left hover:bg-white/[0.03] rounded-lg px-1 transition"
          >
            <span className="text-xl">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm truncate">{c.title}</div>
              {(c.monthlyLimit ?? 0) > 0 && (
                <div className="text-xs text-white/55 tabular-nums">
                  бюджет {formatMoney(c.monthlyLimit ?? 0, state.currency)}/мес
                </div>
              )}
            </div>
          </button>
        ))}
        {list.length === 0 && <span className="text-xs text-white/55">Категорий пока нет</span>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          maxLength={4}
          className="w-12 bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-white text-lg text-center focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          maxLength={40}
          placeholder="Новая категория"
          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
        <button
          onClick={handleAdd}
          className="px-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition"
          aria-label="Добавить категорию"
        >
          <Plus size={16} />
        </button>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Категория">
        {editing && (
          <CategoryEditForm
            category={editing}
            currencyHint={state.currency === 'USD' ? '$' : 'сум'}
            onSave={(patch) => {
              editCategory(editing.id, patch)
              setEditing(null)
            }}
            onDelete={async () => {
              const cat = editing
              if (!cat) return
              if (
                await confirm({
                  message: `Удалить категорию «${cat.title}»? Прошлые траты сохранятся, но потеряют категорию.`,
                  danger: true,
                })
              ) {
                deleteCategory(cat.id)
                setEditing(null)
              }
            }}
          />
        )}
      </Modal>
    </SettingsCard>
  )
}

function CategoryEditForm({
  category,
  currencyHint,
  onSave,
  onDelete,
}: {
  category: ExpenseCategory
  currencyHint: string
  onSave: (patch: { title?: string; emoji?: string; monthlyLimit?: number }) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(category.title)
  const [emoji, setEmoji] = useState(category.emoji)
  const [limit, setLimit] = useState(category.monthlyLimit ? String(category.monthlyLimit) : '')
  const [err, setErr] = useState<string | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const t = title.trim()
    if (!t) return setErr('Введи название')
    const limitNum = limit.trim() ? Number(limit) : undefined
    if (limitNum !== undefined && (!Number.isFinite(limitNum) || limitNum <= 0)) {
      return setErr('Бюджет должен быть больше 0 (или пусто)')
    }
    onSave({ title: t, emoji: emoji.trim() || '📦', monthlyLimit: limitNum })
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          className="w-16 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white text-2xl text-center focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={40}
          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
      </div>

      <label className="block">
        <span className="text-sm text-white/70 font-semibold mb-1.5 block">
          Бюджет в месяц, {currencyHint} (необязательно)
        </span>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          inputMode="numeric"
          min={1}
          placeholder="без лимита"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white tabular-nums placeholder:text-white/30 focus:border-[var(--color-gold)]/50 focus:outline-none transition"
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
        Сохранить
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 py-3 text-[var(--color-coral)] text-sm font-semibold hover:bg-[var(--color-coral)]/10 rounded-xl transition"
      >
        <Trash2 size={16} />
        Удалить категорию
      </button>
    </form>
  )
}
