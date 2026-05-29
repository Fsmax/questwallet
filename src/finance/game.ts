import type { AppState } from '../types'
import { getCurrentDay, isYesterday } from '../lib/dates'

const BASE_XP = 100
const GROWTH = 1.25

export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round((BASE_XP * (Math.pow(GROWTH, level - 1) - 1)) / (GROWTH - 1))
}

export interface LevelInfo {
  level: number
  rem: number
  need: number
  progress: number
}

export function calcLevel(xp: number): LevelInfo {
  let level = 1
  while (xp >= totalXpForLevel(level + 1)) level++
  const rem = xp - totalXpForLevel(level)
  const need = totalXpForLevel(level + 1) - totalXpForLevel(level)
  return { level, rem, need, progress: rem / need }
}

/**
 * Обновляет streak при первом за день выполненном задании.
 * Возвращает { newStreak, newLastActive, incremented } —
 * incremented нужен для корректного отката если откатывают единственное задание дня.
 */
export function tickStreak(
  prev: AppState,
  now: Date,
): { streak: number; lastActiveDate: string; incremented: boolean } {
  const today = getCurrentDay(now, prev.timezone, prev.dayResetHour)

  if (prev.lastActiveDate === today) {
    return { streak: prev.streak, lastActiveDate: today, incremented: false }
  }

  const wasYesterday = isYesterday(prev.lastActiveDate, today)
  const newStreak = wasYesterday ? prev.streak + 1 : 1
  return { streak: newStreak, lastActiveDate: today, incremented: true }
}

/**
 * Логический streak для UI: если последняя активность не сегодня и не вчера → серия прервана.
 */
export function visibleStreak(state: AppState, now: Date): number {
  const today = getCurrentDay(now, state.timezone, state.dayResetHour)
  if (state.lastActiveDate === today) return state.streak
  if (isYesterday(state.lastActiveDate, today)) return state.streak
  return 0
}

/**
 * Сброс ежедневных галочек если день поменялся.
 * Возвращает новый state ИЛИ тот же, если день не поменялся.
 */
export function dailyResetIfNeeded(state: AppState, now: Date): AppState {
  const today = getCurrentDay(now, state.timezone, state.dayResetHour)
  if (state.lastResetDate === today) return state

  return {
    ...state,
    lastResetDate: today,
    streakIncrementedToday: false,
    tasks: state.tasks.map((t) => ({ ...t, doneToday: false })),
    skillTasks: state.skillTasks.map((t) => ({ ...t, doneToday: false })),
    // lastRemindedDate не чистим: вчерашняя дата уже !== today, напоминания сработают.
    dayTasks: state.dayTasks.map((t) => ({ ...t, done: false })),
  }
}

/**
 * Есть ли сегодня хоть одна выполненная активность среди квестов, заданий навыков
 * и дел дня (необязательно исключив одну по id). Нужно для корректного отката серии:
 * отмена одного выполнения не должна ронять серию, которую держит другое.
 */
export function hasOtherActivityToday(state: AppState, excludeId?: string): boolean {
  return (
    state.tasks.some((t) => t.id !== excludeId && t.doneToday) ||
    state.skillTasks.some((t) => t.id !== excludeId && t.doneToday) ||
    state.dayTasks.some((t) => t.id !== excludeId && t.done)
  )
}
