import { AnimatePresence, motion } from 'framer-motion'

interface FloatingRewardProps {
  show: boolean
  text: string
}

export function FloatingReward({ show, text }: FloatingRewardProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -56, scale: 1 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-gold)] drop-shadow-[0_2px_8px_rgba(255,214,107,0.6)] whitespace-nowrap"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
