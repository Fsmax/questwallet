import { useEffect } from 'react'
import { useAppState } from '../state/AppStateContext'
import { getCurrentDay } from '../lib/dates'

/**
 * Напоминания по делам дня: при открытии и каждую минуту проверяет, не пора ли
 * напомнить о деле. Срабатывает для дела, у которого: включено напоминание, задано
 * время, оно ещё не выполнено, сегодня ещё не напоминали и время уже наступило.
 * Все сработавшие за тик помечаются одним батчем (один commit).
 */
export function useDayReminders() {
  const { state, markDayTasksReminded } = useAppState()

  useEffect(() => {
    if (!state) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const check = () => {
      const cur = state
      const now = new Date()
      const today = getCurrentDay(now, cur.timezone, cur.dayResetHour)
      const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`

      const due = cur.dayTasks.filter(
        (t) =>
          t.reminderEnabled &&
          t.time !== null &&
          !t.done &&
          t.lastRemindedDate !== today &&
          hhmm >= t.time,
      )
      if (due.length === 0) return

      for (const t of due) {
        showNotification(`${t.emoji} ${t.title}`, t.time ? `Запланировано на ${t.time}` : 'Пора заняться делом')
      }
      markDayTasksReminded(
        due.map((t) => t.id),
        today,
      )
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [state, markDayTasksReminded])
}

function showNotification(title: string, body: string) {
  try {
    new Notification(title, { body, icon: '/pwa-192x192.png' })
  } catch {
    /* ignore */
  }
}
