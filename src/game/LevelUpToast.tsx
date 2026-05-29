import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface LevelUpToastProps {
  level: number | null
  onClose: () => void
}

export function LevelUpToast({ level, onClose }: LevelUpToastProps) {
  useEffect(() => {
    if (level === null) return
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.3 },
      colors: ['#FFD66B', '#3DDC97', '#ffffff'],
    })
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [level, onClose])

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="px-5 py-3 bg-gradient-to-br from-[var(--color-gold)] to-[#F0A933] rounded-2xl shadow-2xl shadow-[var(--color-gold)]/40 flex items-center gap-3 pointer-events-auto cursor-pointer" onClick={onClose}>
            <Sparkles className="text-[var(--color-bg-deep)]" size={22} fill="currentColor" />
            <div className="text-[var(--color-bg-deep)]">
              <div className="text-xs uppercase tracking-wide font-bold opacity-80">Level Up!</div>
              <div className="font-[family-name:var(--font-display)] text-xl font-extrabold leading-tight">
                Уровень {level}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
