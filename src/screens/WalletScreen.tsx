import { useState } from 'react'
import { motion } from 'framer-motion'
import { Minus } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/useAuth'
import { BalanceCard } from '../dashboard/BalanceCard'
import { Modal } from '../components/Modal'
import { SpendDialog } from '../wallet/SpendDialog'
import { TransactionsList } from '../wallet/TransactionsList'

export function WalletScreen() {
  const { state, spend } = useAppState()
  const auth = useAuth()
  const [spendOpen, setSpendOpen] = useState(false)

  if (!state || !auth.user) return null

  const handleSpend = (amount: number, label: string) => {
    spend(amount, label)
    setSpendOpen(false)
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-4"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        <BalanceCard balance={state.balance} currency={state.currency} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        <button
          onClick={() => setSpendOpen(true)}
          disabled={state.balance <= 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--color-coral)] text-white font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-[var(--color-coral)]/20"
        >
          <Minus size={18} strokeWidth={3} />
          Записать расход
        </button>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        <h2 className="text-sm uppercase tracking-wide text-white/40 font-bold mb-2 px-1">
          История операций
        </h2>
        <TransactionsList state={state} userId={auth.user.id} currency={state.currency} />
      </motion.div>

      <Modal open={spendOpen} onClose={() => setSpendOpen(false)} title="Расход">
        <SpendDialog balance={state.balance} currency={state.currency} onSubmit={handleSpend} />
      </Modal>
    </motion.div>
  )
}
