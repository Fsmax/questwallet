import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import type { Currency } from '../types'
import { formatMoney } from '../lib/format'

interface BalanceCardProps {
  balance: number
  currency: Currency
}

export function BalanceCard({ balance, currency }: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#1a2c50] to-[#0f1b35] border border-[var(--color-gold)]/20 shadow-xl"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[var(--color-gold)]/15 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 text-white/60 text-sm font-semibold mb-2">
          <Coins size={16} className="text-[var(--color-gold)]" />
          Кошелёк
        </div>
        <div className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--color-gold)] tabular-nums break-all">
          {formatMoney(balance, currency)}
        </div>
      </div>
    </motion.div>
  )
}
