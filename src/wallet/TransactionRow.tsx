import {
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  HandCoins,
  Landmark,
  Banknote,
  Pencil,
} from 'lucide-react'
import type { Transaction, Currency, TxType } from '../types'
import { formatMoney } from '../lib/format'

interface TransactionRowProps {
  tx: Transaction
  currency: Currency
  onEdit?: () => void
}

const META: Record<TxType, { Icon: typeof TrendingUp; color: string; bg: string; sign: '+' | '-' | '→' | '←' }> = {
  earn: { Icon: TrendingUp, color: 'text-[var(--color-emerald-quest)]', bg: 'bg-[var(--color-emerald-quest)]/15', sign: '+' },
  spend: { Icon: TrendingDown, color: 'text-[var(--color-coral)]', bg: 'bg-[var(--color-coral)]/15', sign: '-' },
  save: { Icon: ArrowDownToLine, color: 'text-[var(--color-gold)]', bg: 'bg-[var(--color-gold)]/15', sign: '→' },
  withdraw: { Icon: ArrowUpFromLine, color: 'text-white/70', bg: 'bg-white/10', sign: '←' },
  // Долги: дал/отдал — минус (coral), вернули/взял — плюс (emerald)
  lend: { Icon: HandCoins, color: 'text-[var(--color-coral)]', bg: 'bg-[var(--color-coral)]/15', sign: '-' },
  collect: { Icon: HandCoins, color: 'text-[var(--color-emerald-quest)]', bg: 'bg-[var(--color-emerald-quest)]/15', sign: '+' },
  borrow: { Icon: Landmark, color: 'text-[var(--color-emerald-quest)]', bg: 'bg-[var(--color-emerald-quest)]/15', sign: '+' },
  settle: { Icon: Landmark, color: 'text-[var(--color-coral)]', bg: 'bg-[var(--color-coral)]/15', sign: '-' },
  deposit: { Icon: Banknote, color: 'text-[var(--color-emerald-quest)]', bg: 'bg-[var(--color-emerald-quest)]/15', sign: '+' },
}

export function TransactionRow({ tx, currency, onEdit }: TransactionRowProps) {
  const meta = META[tx.type]
  const time = new Date(tx.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const content = (
    <>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
        <meta.Icon size={16} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-white text-sm truncate">{tx.label}</div>
        <div className="text-xs text-white/40 tabular-nums">{time}</div>
      </div>
      <div className={`font-bold tabular-nums text-sm ${meta.color}`}>
        {meta.sign === '+' && '+'}
        {meta.sign === '-' && '−'}
        {formatMoney(tx.amount, currency)}
      </div>
      {onEdit && <Pencil size={14} className="text-white/25 flex-shrink-0" />}
    </>
  )

  if (onEdit) {
    return (
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition">
      {content}
    </div>
  )
}
