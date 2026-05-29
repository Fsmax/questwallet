import { calcLevel } from '../finance/game'

interface LevelBadgeProps {
  xp: number
  size?: number
}

export function LevelBadge({ xp, size = 80 }: LevelBadgeProps) {
  const { level, progress } = calcLevel(xp)
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-wide text-white/50 font-semibold leading-none">
          Уровень
        </span>
        <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-gold)] leading-tight">
          {level}
        </span>
      </div>
    </div>
  )
}
