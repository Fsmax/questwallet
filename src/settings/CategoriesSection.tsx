import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { SettingsCard } from './SettingsCard'

export function CategoriesSection() {
  const { state, addCategory, deleteCategory } = useAppState()
  const [emoji, setEmoji] = useState('📦')
  const [title, setTitle] = useState('')

  if (!state) return null

  const list = [...state.expenseCategories].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    const t = title.trim()
    if (!t) return
    addCategory({ title: t, emoji: emoji.trim() || '📦' })
    setTitle('')
    setEmoji('📦')
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Удалить категорию «${name}»? Прошлые траты сохранятся, но потеряют категорию.`)) {
      deleteCategory(id)
    }
  }

  return (
    <SettingsCard title="Категории расходов">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {list.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1 text-xs pl-2.5 pr-1.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80"
          >
            {c.emoji} {c.title}
            <button
              onClick={() => handleDelete(c.id, c.title)}
              className="text-white/30 hover:text-[var(--color-coral)] transition"
              aria-label={`Удалить ${c.title}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        {list.length === 0 && <span className="text-xs text-white/40">Категорий пока нет</span>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          className="w-12 bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-white text-lg text-center focus:border-[var(--color-gold)]/50 focus:outline-none transition"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
    </SettingsCard>
  )
}
