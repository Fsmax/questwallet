import type { AppState, RemindersConfig } from '../types'

const DEFAULT_REMINDERS: RemindersConfig = {
  enabled: false,
  morningTime: '09:00',
  eveningTime: '21:00',
  eveningEnabled: false,
  softAskDismissedAt: null,
}

/**
 * Заполняет недостающие поля в state дефолтами.
 * Нужно для пользователей, у которых state сохранён в облаке до добавления новых полей.
 */
export function ensureDefaults(state: AppState): AppState {
  let changed = false
  let next = state

  if (!next.reminders) {
    next = { ...next, reminders: DEFAULT_REMINDERS }
    changed = true
  } else {
    const r = next.reminders
    const filled: RemindersConfig = {
      enabled: r.enabled ?? DEFAULT_REMINDERS.enabled,
      morningTime: r.morningTime ?? DEFAULT_REMINDERS.morningTime,
      eveningTime: r.eveningTime ?? DEFAULT_REMINDERS.eveningTime,
      eveningEnabled: r.eveningEnabled ?? DEFAULT_REMINDERS.eveningEnabled,
      softAskDismissedAt: r.softAskDismissedAt ?? null,
    }
    if (JSON.stringify(filled) !== JSON.stringify(r)) {
      next = { ...next, reminders: filled }
      changed = true
    }
  }

  if (!next.lastNotifiedDate) {
    next = { ...next, lastNotifiedDate: { morning: '', evening: '' } }
    changed = true
  }

  if (next.dayResetHour === undefined || next.dayResetHour === null) {
    next = { ...next, dayResetHour: 4 }
    changed = true
  }

  if (!next.timezone) {
    try {
      next = { ...next, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }
    } catch {
      next = { ...next, timezone: 'UTC' }
    }
    changed = true
  }

  if (!Array.isArray(next.skills)) {
    next = { ...next, skills: [] }
    changed = true
  }
  if (!Array.isArray(next.skillTasks)) {
    next = { ...next, skillTasks: [] }
    changed = true
  }

  if (typeof next.totalCompleted !== 'number') {
    next = { ...next, totalCompleted: 0 }
    changed = true
  }
  if (!Array.isArray(next.unlockedAchievements)) {
    next = { ...next, unlockedAchievements: [] }
    changed = true
  }

  return changed ? next : state
}
