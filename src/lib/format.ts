import type { Currency } from '../types'

const sumFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return `$${usdFormatter.format(amount)}`
  }
  return `${sumFormatter.format(Math.round(amount))} сум`
}

/**
 * Краткая форма для больших чисел (баланс на главной).
 * 1 500 000 → "1.5М сум", 250 000 → "250К сум".
 */
export function formatMoneyShort(amount: number, currency: Currency): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) {
    const v = (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)
    return currency === 'USD' ? `$${v}М` : `${v}М сум`
  }
  if (abs >= 10_000) {
    const v = Math.round(amount / 1_000)
    return currency === 'USD' ? `$${v}К` : `${v}К сум`
  }
  return formatMoney(amount, currency)
}

export function formatNumber(n: number): string {
  return sumFormatter.format(n)
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}
