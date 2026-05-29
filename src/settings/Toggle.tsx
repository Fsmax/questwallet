interface ToggleProps {
  on: boolean
  onToggle: () => void
  label?: string
}

export function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${
        on ? 'bg-[var(--color-gold)]' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}
