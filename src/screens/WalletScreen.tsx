import { useState } from 'react'
import { motion } from 'framer-motion'
import { Minus } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/useAuth'
import { BalanceCard } from '../dashboard/BalanceCard'
import { Modal } from '../components/Modal'
import { SpendDialog } from '../wallet/SpendDialog'
import { TransactionsList } from '../wallet/TransactionsList'
import { StatsView } from '../wallet/StatsView'

type WalletTab = 'history' | 'stats'

export function WalletScreen() {
  const { state, spend } = useAppState()
  const auth = useAuth()
  const [spendOpen, setSpendOpen] = useState(false)
  const [tab, setTab] = useState<WalletTab>('history')

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

      {/* Под-табы: История / Статистика */}
      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        <div className="flex bg-black/20 rounded-xl p-1 gap-1">
          <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
            История
          </TabButton>
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>
            Статистика
          </TabButton>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        {tab === 'history' ? (
          <TransactionsList state={state} userId={auth.user.id} currency={state.currency} />
        ) : (
          <StatsView state={state} userId={auth.user.id} currency={state.currency} />
        )}
      </motion.div>

      <Modal open={spendOpen} onClose={() => setSpendOpen(false)} title="Расход">
        <SpendDialog balance={state.balance} currency={state.currency} onSubmit={handleSpend} />
      </Modal>
    </motion.div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
        active ? 'bg-[var(--color-gold)] text-[var(--color-bg-deep)]' : 'text-white/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
