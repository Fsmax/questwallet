interface SegmentedTabsProps<T extends string> {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}

/** Сегментированный переключатель под-вкладок (Кошелёк, Личный рост, Финансы). */
export function SegmentedTabs<T extends string>({ tabs, active, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="flex bg-black/20 rounded-xl p-1 gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            active === t.id
              ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
