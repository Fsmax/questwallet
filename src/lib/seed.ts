import type { AppState, Task, Goal, Skill, SkillTask } from '../types'
import { CURRENT_SCHEMA_VERSION } from '../types'
import { detectTimezone, getCurrentDay } from './dates'

export const SEED_TASKS: Omit<Task, 'id' | 'doneToday'>[] = [
  { title: 'Утренняя зарядка', emoji: '💪', reward: 200, xpReward: 10 },
  { title: 'Чтение 30 минут', emoji: '📖', reward: 250, xpReward: 15 },
  { title: 'Медитация', emoji: '🧘', reward: 200, xpReward: 10 },
  { title: '2 литра воды', emoji: '💧', reward: 150, xpReward: 5 },
  { title: 'Без соцсетей до обеда', emoji: '📵', reward: 300, xpReward: 15 },
  { title: 'Выучить что-то новое', emoji: '🌱', reward: 300, xpReward: 20 },
  { title: 'Лечь спать вовремя', emoji: '🛌', reward: 200, xpReward: 10 },
  { title: 'Спланировать день', emoji: '📝', reward: 150, xpReward: 5 },
]

export const SEED_GOALS: Omit<Goal, 'id' | 'saved' | 'createdAt' | 'completedAt' | 'order'>[] = [
  { title: 'Квартира', emoji: '🏠', target: 500_000_000 },
  { title: 'Машина', emoji: '🚗', target: 150_000_000 },
]

export interface SeedSkill {
  title: string
  emoji: string
  tasks: { title: string; emoji: string; reward: number; xpReward: number }[]
}

export const SEED_SKILLS: SeedSkill[] = [
  {
    title: 'Программирование',
    emoji: '💻',
    tasks: [
      { title: 'Решить задачу', emoji: '🧩', reward: 500, xpReward: 25 },
      { title: 'Изучить новую тему', emoji: '📚', reward: 400, xpReward: 20 },
      { title: 'Поработать над пет-проектом', emoji: '🛠️', reward: 600, xpReward: 30 },
    ],
  },
  {
    title: 'Английский',
    emoji: '🇬🇧',
    tasks: [
      { title: 'Урок Duolingo', emoji: '🦉', reward: 200, xpReward: 15 },
      { title: '15 новых слов', emoji: '🔤', reward: 300, xpReward: 20 },
      { title: 'Посмотреть видео', emoji: '🎬', reward: 250, xpReward: 15 },
    ],
  },
  {
    title: 'Спорт',
    emoji: '🏋️',
    tasks: [
      { title: 'Тренировка 30 минут', emoji: '💪', reward: 400, xpReward: 25 },
      { title: '10 000 шагов', emoji: '👟', reward: 300, xpReward: 15 },
      { title: 'Растяжка', emoji: '🧘', reward: 200, xpReward: 10 },
    ],
  },
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
        reward: t.reward,
        xpReward: t.xpReward,
        doneToday: false,
      })
    })
  })

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
    goals,
    transactions: [],
  }
}
