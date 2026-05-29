import type { AppState } from '../types'
import { getCurrentDay, isYesterday, previousDay } from '../lib/dates'

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
    // Заработанные за прошлый день деньги остаются; сбрасываем только отметку и ссылку на tx.
    workTasks: state.workTasks.map((t) => ({ ...t, doneToday: false, lastEarnTxId: null })),
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

export interface StreakFields {
  streak: number
  lastActiveDate: string
  streakIncrementedToday: boolean
}

/**
 * Поля серии после отмены активности (квест/навык/дело дня).
 * Серию откатываем только если её подняли сегодня И за сегодня не осталось другой
 * выполненной активности (excludeId исключается из проверки).
 *
 * Важно: при откате lastActiveDate возвращаем НА ВЧЕРА, а не в '', если серия осталась
 * (>0). Здесь state.lastActiveDate == сегодня (его выставил tickStreak при инкременте),
 * поэтому previousDay(today) = вчера. Иначе повторная отметка в тот же день не продолжила
 * бы серию (isYesterday('') === false), а сбросила её в 1 — терялся накопленный прогресс.
 */
export function rollbackStreakOnCancel(state: AppState, excludeId: string): StreakFields {
  const shouldRollback =
    state.streakIncrementedToday && !hasOtherActivityToday(state, excludeId)

  if (!shouldRollback) {
    return {
      streak: state.streak,
      lastActiveDate: state.lastActiveDate,
      streakIncrementedToday: state.streakIncrementedToday,
    }
  }

  const streak = Math.max(0, state.streak - 1)
  return {
    streak,
    lastActiveDate: streak > 0 ? previousDay(state.lastActiveDate) : '',
    streakIncrementedToday: false,
  }
}
