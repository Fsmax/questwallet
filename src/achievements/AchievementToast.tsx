import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { ACHIEVEMENTS } from './defs'

interface AchievementToastProps {
  achievementId: string | null
  onClose: () => void
}

export function AchievementToast({ achievementId, onClose }: AchievementToastProps) {
  const def = achievementId ? ACHIEVEMENTS.find((a) => a.id === achievementId) : null

  useEffect(() => {
    if (!def) return
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.35 },
      colors: ['#FFD66B', '#3DDC97', '#FF7A5C', '#ffffff'],
    })
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [def, onClose])

  return (
    <AnimatePresence>
      {def && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-2 w-full max-w-sm"
        >
          <div
            onClick={onClose}
            className="mx-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-[#1a2c50] to-[#0f1b35] border border-[var(--color-gold)]/40 shadow-2xl shadow-[var(--color-gold)]/20 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/15 flex items-center justify-center text-2xl flex-shrink-0">
              {def.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-gold)]/80">
                Достижение разблокировано
              </div>
              <div className="font-[family-name:var(--font-display)] text-lg font-bold text-white leading-tight truncate">
                {def.title}
              </div>
              <div className="text-xs text-white/50 truncate">{def.desc}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
