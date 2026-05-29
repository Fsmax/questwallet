import { describe, it, expect } from 'vitest'
import { getCurrentDay, isYesterday } from './dates'

describe('getCurrentDay — 4am day boundary', () => {
  const TZ = 'Asia/Tashkent' // UTC+5

  it('02:00 local with resetHour=4 → ещё вчерашний день', () => {
    // 2026-05-28 02:00 Asia/Tashkent = 2026-05-27 21:00 UTC
    const now = new Date('2026-05-27T21:00:00Z')
    expect(getCurrentDay(now, TZ, 4)).toBe('2026-05-27')
  })

  it('04:01 local with resetHour=4 → уже новый день', () => {
    // 2026-05-28 04:01 Asia/Tashkent = 2026-05-27 23:01 UTC
    const now = new Date('2026-05-27T23:01:00Z')
    expect(getCurrentDay(now, TZ, 4)).toBe('2026-05-28')
  })

  it('14:00 local — любой час дня = текущий день', () => {
    const now = new Date('2026-05-28T09:00:00Z') // 14:00 Tashkent
    expect(getCurrentDay(now, TZ, 4)).toBe('2026-05-28')
  })

  it('23:59 local — текущий день, не следующий', () => {
    const now = new Date('2026-05-28T18:59:00Z') // 23:59 Tashkent
    expect(getCurrentDay(now, TZ, 4)).toBe('2026-05-28')
  })

  it('resetHour=0 ведёт себя как обычная полночь', () => {
    const at02 = new Date('2026-05-27T21:00:00Z') // 02:00 Tashkent
    expect(getCurrentDay(at02, TZ, 0)).toBe('2026-05-28')
  })

  it('UTC timezone тоже работает', () => {
    const now = new Date('2026-05-28T03:30:00Z')
    expect(getCurrentDay(now, 'UTC', 4)).toBe('2026-05-27')
  })
})

describe('isYesterday', () => {
  it('27 → 28 это вчера', () => {
    expect(isYesterday('2026-05-27', '2026-05-28')).toBe(true)
  })

  it('26 → 28 это не вчера', () => {
    expect(isYesterday('2026-05-26', '2026-05-28')).toBe(false)
  })

  it('тот же день — не вчера', () => {
    expect(isYesterday('2026-05-28', '2026-05-28')).toBe(false)
  })

  it('пустая строка — не вчера', () => {
    expect(isYesterday('', '2026-05-28')).toBe(false)
  })

  it('переход месяца: 30 апреля → 1 мая', () => {
    expect(isYesterday('2026-04-30', '2026-05-01')).toBe(true)
  })

  it('переход года: 31 дек → 1 янв', () => {
    expect(isYesterday('2025-12-31', '2026-01-01')).toBe(true)
  })
})
