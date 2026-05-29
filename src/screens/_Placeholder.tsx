interface PlaceholderProps {
  emoji: string
  title: string
  subtitle: string
}

export function Placeholder({ emoji, title, subtitle }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="text-6xl mb-4">{emoji}</div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white mb-2">
        {title}
      </h1>
      <p className="text-white/50 max-w-xs">{subtitle}</p>
      <span className="mt-6 text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
        Скоро
      </span>
    </div>
  )
}
