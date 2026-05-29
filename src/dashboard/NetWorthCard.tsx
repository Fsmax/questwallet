import type { Currency } from '../types'
import { formatMoney } from '../lib/format'

interface NetWorthCardProps {
  balance: number
  goalsSaved: number
  owedToMe: number
  iOwe: number
  currency: Currency
}

export function NetWorthCard({ balance, goalsSaved, owedToMe, iOwe, currency }: NetWorthCardProps) {
  const net = balance + goalsSaved + owedToMe - iOwe

  const rows = (
    [
      { label: 'Кошелёк', value: balance, sign: '+' },
      { label: 'На целях', value: goalsSaved, sign: '+' },
      { label: 'Мне должны', value: owedToMe, sign: '+' },
      { label: 'Я должен', value: iOwe, sign: '-' },
    ] as const
  ).filter((r) => r.value > 0)

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a2c50] to-[#0f1b35] border border-white/10">
      <div className="text-xs uppercase tracking-wide text-white/50 font-semibold">Всего капитал</div>
      <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-white tabular-nums mt-0.5">
        {formatMoney(net, currency)}
      </div>
      {rows.length > 1 && (
        <div className="mt-3 space-y-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-white/50">{r.label}</span>
              <span
                className={`tabular-nums ${
                  r.sign === '-' ? 'text-[var(--color-coral)]' : 'text-white/80'
                }`}
              >
                {r.sign === '-' ? '−' : ''}
                {formatMoney(r.value, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
