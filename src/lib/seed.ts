import type { AppState, Task, Goal, Skill, SkillTask, ExpenseCategory, DayTask } from '../types'
import { CURRENT_SCHEMA_VERSION } from '../types'
import { detectTimezone, getCurrentDay } from './dates'

export const SEED_CATEGORIES: Omit<ExpenseCategory, 'id' | 'order'>[] = [
  { title: 'Еда', emoji: '🍔' },
  { title: 'Продукты', emoji: '🛒' },
  { title: 'Транспорт', emoji: '🚕' },
  { title: 'Дом', emoji: '🏠' },
  { title: 'Здоровье', emoji: '💊' },
  { title: 'Развлечения', emoji: '🎬' },
  { title: 'Покупки', emoji: '🛍️' },
  { title: 'Связь', emoji: '📱' },
  { title: 'Другое', emoji: '📦' },
]

export function seedCategories(): ExpenseCategory[] {
  return SEED_CATEGORIES.map((c, idx) => ({
    ...c,
    id: crypto.randomUUID(),
    order: idx,
  }))
}

export const SEED_TASKS: Omit<Task, 'id' | 'doneToday'>[] = [
  { title: 'Утренняя зарядка', emoji: '💪', xpReward: 10 },
  { title: 'Чтение 30 минут', emoji: '📖', xpReward: 15 },
  { title: 'Медитация', emoji: '🧘', xpReward: 10 },
  { title: '2 литра воды', emoji: '💧', xpReward: 5 },
  { title: 'Без соцсетей до обеда', emoji: '📵', xpReward: 15 },
  { title: 'Выучить что-то новое', emoji: '🌱', xpReward: 20 },
  { title: 'Лечь спать вовремя', emoji: '🛌', xpReward: 10 },
  { title: 'Спланировать день', emoji: '📝', xpReward: 5 },
]

export const SEED_GOALS: Omit<Goal, 'id' | 'saved' | 'createdAt' | 'completedAt' | 'order'>[] = [
  { title: 'Квартира', emoji: '🏠', target: 500_000_000 },
  { title: 'Машина', emoji: '🚗', target: 150_000_000 },
]

export interface SeedSkill {
  title: string
  emoji: string
  tasks: { title: string; emoji: string; xpReward: number }[]
}

export const SEED_SKILLS: SeedSkill[] = [
  {
    title: 'Программирование',
    emoji: '💻',
    tasks: [
      { title: 'Решить задачу', emoji: '🧩', xpReward: 25 },
      { title: 'Изучить новую тему', emoji: '📚', xpReward: 20 },
      { title: 'Поработать над пет-проектом', emoji: '🛠️', xpReward: 30 },
    ],
  },
  {
    title: 'Английский',
    emoji: '🇬🇧',
    tasks: [
      { title: 'Урок Duolingo', emoji: '🦉', xpReward: 15 },
      { title: '15 новых слов', emoji: '🔤', xpReward: 20 },
      { title: 'Посмотреть видео', emoji: '🎬', xpReward: 15 },
    ],
  },
  {
    title: 'Спорт',
    emoji: '🏋️',
    tasks: [
      { title: 'Тренировка 30 минут', emoji: '💪', xpReward: 25 },
      { title: '10 000 шагов', emoji: '👟', xpReward: 15 },
      { title: 'Растяжка', emoji: '🧘', xpReward: 10 },
    ],
  },
]

/** Стартовые дела дня (тайм-тудо) для первого запуска. */
export const SEED_DAYTASKS: { title: string; emoji: string; time: string | null; reminderEnabled: boolean }[] = [
  { title: 'Подъём и стакан воды', emoji: '☀️', time: '07:00', reminderEnabled: true },
  { title: 'Спорт / зарядка', emoji: '🏃', time: '08:00', reminderEnabled: true },
  { title: 'Подвести итоги дня', emoji: '📝', time: '22:00', reminderEnabled: false },
]

export function createInitialState(now: Date = new Date()): AppState {
  const timezone = detectTimezone()
  const dayResetHour = 4
  const today = getCurrentDay(now, timezone, dayResetHour)

  const tasks: Task[] = SEED_TASKS.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    doneToday: false,
  }))

  const goals: Goal[] = SEED_GOALS.map((g, idx) => ({
    ...g,
    id: crypto.randomUUID(),
    saved: 0,
    order: idx,
    createdAt: now.getTime(),
    completedAt: null,
  }))

  const skills: Skill[] = []
  const skillTasks: SkillTask[] = []
  SEED_SKILLS.forEach((s, idx) => {
    const skillId = crypto.randomUUID()
    skills.push({
      id: skillId,
      title: s.title,
      emoji: s.emoji,
      xp: 0,
      order: idx,
      createdAt: now.getTime(),
    })
    s.tasks.forEach((t) => {
      skillTasks.push({
        id: crypto.randomUUID(),
        skillId,
        title: t.title,
        emoji: t.emoji,
        xpReward: t.xpReward,
        doneToday: false,
      })
    })
  })

  const dayTasks: DayTask[] = SEED_DAYTASKS.map((d, idx) => ({
    ...d,
    id: crypto.randomUUID(),
    done: false,
    lastRemindedDate: '',
    order: idx,
    createdAt: now.getTime(),
  }))

  return {
    version: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    timezone,
    dayResetHour,
    currency: 'сум',
    balance: 0,
    totalEarned: 0,
    xp: 0,
    totalCompleted: 0,
    streak: 0,
    streakIncrementedToday: false,
    unlockedAchievements: [],
    lastActiveDate: '',
    lastResetDate: today,
    lastNotifiedDate: { morning: '', evening: '' },
    reminders: {
      enabled: false,
      morningTime: '09:00',
      eveningTime: '21:00',
      eveningEnabled: false,
      softAskDismissedAt: null,
    },
    tasks,
    skills,
    skillTasks,
    dayTasks,
    goals,
    transactions: [],
    expenseCategories: seedCategories(),
    recurringExpenses: [],
    debts: [],
  }
}
