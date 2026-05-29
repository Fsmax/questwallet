import { useEffect } from 'react'
import { useAppState } from '../state/AppStateContext'
import { getCurrentDay } from '../lib/dates'

/**
 * Проверяет при открытии и каждую минуту: пора ли показать утреннее/вечернее уведомление.
 * Срабатывает только если: разрешение granted, фича включена, время уже прошло, сегодня ещё не показывали.
 */
export function useReminders() {
  const { state, markNotified } = useAppState()

  useEffect(() => {
    if (!state) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (!state.reminders.enabled) return
    if (Notification.permission !== 'granted') return

    const check = () => {
      const cur = state
      const now = new Date()
      const today = getCurrentDay(now, cur.timezone, cur.dayResetHour)
      const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      // Утро
      if (cur.lastNotifiedDate.morning !== today && hhmm >= cur.reminders.morningTime) {
        const pending = cur.tasks.filter((t) => !t.doneToday).length
        if (pending > 0) {
          showNotification('Доброе утро! 🎯', `У тебя ${pending} квестов на сегодня`)
        } else {
          showNotification('Доброе утро! ✨', 'Все квесты уже закрыты — отличный старт!')
        }
        markNotified('morning', today)
      }

      // Вечер
      if (
        cur.reminders.eveningEnabled &&
        cur.lastNotifiedDate.evening !== today &&
        hhmm >= cur.reminders.eveningTime
      ) {
        const pending = cur.tasks.filter((t) => !t.doneToday).length
        if (pending > 0 && cur.streak > 0) {
          showNotification(
            `Серия ${cur.streak} 🔥`,
            `Не забудь отметить выполненное за день — ещё ${pending} осталось`,
          )
          markNotified('evening', today)
        }
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [state, markNotified])
}

function showNotification(title: string, body: string) {
  try {
    new Notification(title, { body, icon: '/favicon.svg' })
  } catch {
    /* ignore */
  }
}
