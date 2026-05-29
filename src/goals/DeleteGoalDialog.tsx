import { Wallet, X } from 'lucide-react'
import type { Currency, Goal } from '../types'
import { formatMoney } from '../lib/format'
import type { DeleteGoalMode } from '../finance/finance'

interface DeleteGoalDialogProps {
  goal: Goal
  currency: Currency
  onChoose: (mode: DeleteGoalMode) => void
  onCancel: () => void
}

export function DeleteGoalDialog({ goal, currency, onChoose, onCancel }: DeleteGoalDialogProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-2">{goal.emoji}</div>
        <div className="font-bold text-white text-lg mb-1">{goal.title}</div>
        <div className="text-sm text-white/60">
          Накоплено: <strong className="text-[var(--color-gold)] tabular-nums">{formatMoney(goal.saved, currency)}</strong>
        </div>
      </div>

      <p className="text-sm text-white/70 text-center">
        Что сделать с накопленными деньгами?
      </p>

      <button
        onClick={() => onChoose('return_to_wallet')}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--color-emerald-quest)]/15 border border-[var(--color-emerald-quest)]/30 hover:bg-[var(--color-emerald-quest)]/20 transition text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-[var(--color-emerald-quest)]/20 flex items-center justify-center flex-shrink-0">
          <Wallet size={20} className="text-[var(--color-emerald-quest)]" />
        </div>
        <div>
          <div className="font-bold text-white">Вернуть в кошелёк</div>
          <div className="text-xs text-white/60">Самый частый выбор</div>
        </div>
      </button>

      <button
        onClick={() => onChoose('discard')}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <X size={20} className="text-white/60" />
        </div>
        <div>
          <div className="font-bold text-white">Списать в никуда</div>
          <div className="text-xs text-white/50">Будто потрачены</div>
        </div>
      </button>

      <button
        onClick={onCancel}
        className="w-full py-2.5 text-white/60 text-sm font-semibold hover:text-white transition"
      >
        Отмена
      </button>
    </div>
  )
}
