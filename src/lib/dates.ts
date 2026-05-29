/**
 * Возвращает "логический день" YYYY-MM-DD с учётом часа сброса и таймзоны пользователя.
 * Всё что между 00:00 и resetHour считается предыдущим днём.
 */
export function getCurrentDay(now: Date, timezone: string, resetHour: number): string {
  const shifted = new Date(now.getTime() - resetHour * 3600_000)
  return formatDateInTz(shifted, timezone)
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function formatDateInTz(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

export function isYesterday(prev: string, today: string): boolean {
  if (!prev) return false
  const prevDate = new Date(`${prev}T12:00:00Z`)
  const todayDate = new Date(`${today}T12:00:00Z`)
  const diffDays = Math.round((todayDate.getTime() - prevDate.getTime()) / 86400_000)
  return diffDays === 1
}
