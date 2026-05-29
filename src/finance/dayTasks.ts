import type { AppState, DayTask } from '../types'
import { FinanceError, validateLabel } from './finance'
import { tickStreak, rollbackStreakOnCancel } from './game'

function newId(): string {
  return crypto.randomUUID()
}

/** Проверка времени "HH:mm" (или null — без времени). */
function validateTime(time: string | null): string | null {
  if (time === null) return null
  const trimmed = time.trim()
  if (!trimmed) return null
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    throw new FinanceError('INVALID_TIME', 'Время должно быть в формате ЧЧ:ММ')
  }
  return trimmed
}

export interface AddDayTaskInput {
  title: string
  emoji: string
  time: string | null
  reminderEnabled: boolean
}

/** Добавить дело дня. */
export function applyAddDayTask(state: AppState, input: AddDayTaskInput, now: Date): AppState {
  validateLabel(input.title)
  const time = validateTime(input.time)
  const maxOrder = state.dayTasks.reduce((m, t) => Math.max(m, t.order), -1)
  const task: DayTask = {
    id: newId(),
    title: input.title.trim(),
    emoji: input.emoji.trim() || '📌',
    time,
    reminderEnabled: input.reminderEnabled,
    done: false,
    lastRemindedDate: '',
    order: maxOrder + 1,
    createdAt: now.getTime(),
  }
  return { ...state, dayTasks: [...state.dayTasks, task] }
}

/** Редактировать дело дня (название/эмодзи/время/напоминание/порядок). */
export function applyEditDayTask(
  state: AppState,
  id: string,
  patch: Partial<Pick<DayTask, 'title' | 'emoji' | 'time' | 'reminderEnabled' | 'order'>>,
): AppState {
  if (!state.dayTasks.some((t) => t.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Дело не найдено')
  }
  if (patch.title !== undefined) validateLabel(patch.title)
  const nextPatch = { ...patch }
  if (patch.time !== undefined) nextPatch.time = validateTime(patch.time)
  return {
    ...state,
    dayTasks: state.dayTasks.map((t) => (t.id === id ? { ...t, ...nextPatch } : t)),
  }
}

/** Удалить дело дня. */
export function applyDeleteDayTask(state: AppState, id: string): AppState {
  if (!state.dayTasks.some((t) => t.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Дело не найдено')
  }
  return { ...state, dayTasks: state.dayTasks.filter((t) => t.id !== id) }
}

/**
 * Отметить дело выполненным: двигает серию (дисциплину), но баллов/опыта не даёт.
 */
export function applyCompleteDayTask(state: AppState, id: string, now: Date): AppState {
  const task = state.dayTasks.find((t) => t.id === id)
  if (!task) throw new FinanceError('NOT_FOUND', 'Дело не найдено')
  if (task.done) throw new FinanceError('ALREADY_DONE', 'Дело уже выполнено')

  const streakUpdate = tickStreak(state, now)

  return {
    ...state,
    streak: streakUpdate.streak,
    lastActiveDate: streakUpdate.lastActiveDate,
    streakIncrementedToday: streakUpdate.incremented || state.streakIncrementedToday,
    dayTasks: state.dayTasks.map((t) => (t.id === id ? { ...t, done: true } : t)),
  }
}

/**
 * Снять отметку выполнения: откатить серию, если за сегодня больше нет активности.
 */
export function applyUncompleteDayTask(state: AppState, id: string): AppState {
  const task = state.dayTasks.find((t) => t.id === id)
  if (!task) throw new FinanceError('NOT_FOUND', 'Дело не найдено')
  if (!task.done) throw new FinanceError('NOT_DONE', 'Дело не было выполнено')

  const sf = rollbackStreakOnCancel(state, id)

  return {
    ...state,
    streak: sf.streak,
    lastActiveDate: sf.lastActiveDate,
    streakIncrementedToday: sf.streakIncrementedToday,
    dayTasks: state.dayTasks.map((t) => (t.id === id ? { ...t, done: false } : t)),
  }
}

/** Пометить, что напоминание по делу показано в указанный день (один раз в день). */
export function applyMarkDayTaskReminded(state: AppState, id: string, day: string): AppState {
  return {
    ...state,
    dayTasks: state.dayTasks.map((t) => (t.id === id ? { ...t, lastRemindedDate: day } : t)),
  }
}
