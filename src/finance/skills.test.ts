import { describe, it, expect } from 'vitest'
import {
  applyEarnSkillTask,
  applyCancelSkillTask,
  applyAddSkill,
  applyEditSkill,
  applyDeleteSkill,
  applyAddSkillTask,
  applyEditSkillTask,
  applyDeleteSkillTask,
  FinanceError,
} from './finance'
import type { AppState, Skill, SkillTask } from '../types'

const NOW = new Date('2026-05-28T09:00:00Z')

function makeState(over: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    schemaVersion: 1,
    timezone: 'Asia/Tashkent',
    dayResetHour: 4,
    currency: 'сум',
    balance: 0,
    totalEarned: 0,
    xp: 0,
    totalCompleted: 0,
    streak: 0,
    streakIncrementedToday: false,
    unlockedAchievements: [],
    lastActiveDate: '',
    lastResetDate: '',
    lastNotifiedDate: { morning: '', evening: '' },
    reminders: {
      enabled: false,
      morningTime: '09:00',
      eveningTime: '21:00',
      eveningEnabled: false,
      softAskDismissedAt: null,
    },
    tasks: [],
    skills: [],
    skillTasks: [],
    dayTasks: [],
    goals: [],
    transactions: [],
    expenseCategories: [],
    recurringExpenses: [],
    debts: [],
    ...over,
  }
}

function makeSkill(over: Partial<Skill> = {}): Skill {
  return {
    id: 's1',
    title: 'Программирование',
    emoji: '💻',
    xp: 0,
    order: 0,
    createdAt: 0,
    ...over,
  }
}

function makeSkillTask(over: Partial<SkillTask> = {}): SkillTask {
  return {
    id: 'st1',
    skillId: 's1',
    title: 'Решить задачу',
    emoji: '🧩',
    xpReward: 25,
    doneToday: false,
    ...over,
  }
}

describe('applyEarnSkillTask', () => {
  it('начисляет баллы (общий опыт и опыт навыка), без денег', () => {
    const s = makeState({
      skills: [makeSkill()],
      skillTasks: [makeSkillTask()],
    })
    const r = applyEarnSkillTask(s, 'st1', NOW)
    expect(r.state.balance).toBe(0)
    expect(r.state.totalEarned).toBe(0)
    expect(r.state.xp).toBe(25)
    expect(r.state.skills[0].xp).toBe(25)
    expect(r.state.totalCompleted).toBe(1)
    expect(r.state.skillTasks[0].doneToday).toBe(true)
  })

  it('двойное выполнение → ошибка', () => {
    const s = makeState({
      skills: [makeSkill()],
      skillTasks: [makeSkillTask({ doneToday: true })],
    })
    expect(() => applyEarnSkillTask(s, 'st1', NOW)).toThrow(FinanceError)
  })

  it('streak обновляется при первом задании дня (любого типа)', () => {
    const s = makeState({
      skills: [makeSkill()],
      skillTasks: [makeSkillTask()],
      streak: 3,
      lastActiveDate: '2026-05-27',
    })
    const r = applyEarnSkillTask(s, 'st1', NOW)
    expect(r.state.streak).toBe(4)
  })
})

describe('applyCancelSkillTask', () => {
  it('откатывает общий опыт и опыт навыка', () => {
    const s1 = makeState({
      skills: [makeSkill()],
      skillTasks: [makeSkillTask()],
    })
    const { state: s2 } = applyEarnSkillTask(s1, 'st1', NOW)
    const { state: s3 } = applyCancelSkillTask(s2, 'st1')
    expect(s3.xp).toBe(0)
    expect(s3.skills[0].xp).toBe(0)
    expect(s3.skillTasks[0].doneToday).toBe(false)
  })

  it('откат единственного действия дня → streak откатывается', () => {
    const s1 = makeState({
      skills: [makeSkill()],
      skillTasks: [makeSkillTask()],
      streak: 5,
      lastActiveDate: '2026-05-27',
    })
    const { state: s2 } = applyEarnSkillTask(s1, 'st1', NOW)
    expect(s2.streak).toBe(6)
    const { state: s3 } = applyCancelSkillTask(s2, 'st1')
    expect(s3.streak).toBe(5)
  })

  it('если есть выполненный обычный квест — streak НЕ откатывается', () => {
    const s = makeState({
      skills: [makeSkill({ xp: 25 })],
      skillTasks: [makeSkillTask({ doneToday: true })],
      tasks: [
        { id: 't1', title: 'X', emoji: '⚔️', xpReward: 5, doneToday: true },
      ],
      streak: 1,
      streakIncrementedToday: true,
      xp: 25,
    })
    const { state } = applyCancelSkillTask(s, 'st1')
    expect(state.streak).toBe(1)
  })
})

describe('applyAddSkill', () => {
  it('добавление навыка с order', () => {
    const s = makeState({ skills: [makeSkill({ id: 's1', order: 0 })] })
    const s2 = applyAddSkill(s, { title: 'Английский', emoji: '🇬🇧' }, NOW)
    expect(s2.skills).toHaveLength(2)
    expect(s2.skills[1].order).toBe(1)
    expect(s2.skills[1].xp).toBe(0)
  })

  it('пустое название → ошибка', () => {
    const s = makeState()
    expect(() => applyAddSkill(s, { title: '', emoji: '🎯' }, NOW)).toThrow(FinanceError)
  })
})

describe('applyEditSkill', () => {
  it('меняем title и emoji', () => {
    const s = makeState({ skills: [makeSkill()] })
    const s2 = applyEditSkill(s, 's1', { title: 'Кодинг', emoji: '⌨️' })
    expect(s2.skills[0].title).toBe('Кодинг')
    expect(s2.skills[0].emoji).toBe('⌨️')
  })
})

describe('applyDeleteSkill', () => {
  it('удаляет навык и все его задания', () => {
    const s = makeState({
      skills: [makeSkill(), makeSkill({ id: 's2', title: 'X' })],
      skillTasks: [
        makeSkillTask({ id: 'st1', skillId: 's1' }),
        makeSkillTask({ id: 'st2', skillId: 's1' }),
        makeSkillTask({ id: 'st3', skillId: 's2' }),
      ],
    })
    const s2 = applyDeleteSkill(s, 's1')
    expect(s2.skills).toHaveLength(1)
    expect(s2.skillTasks).toHaveLength(1)
    expect(s2.skillTasks[0].skillId).toBe('s2')
  })

  it('деньги/XP заработанные раньше остаются', () => {
    const s = makeState({
      balance: 1000,
      xp: 100,
      skills: [makeSkill({ xp: 100 })],
    })
    const s2 = applyDeleteSkill(s, 's1')
    expect(s2.balance).toBe(1000)
    expect(s2.xp).toBe(100)
  })
})

describe('applyAddSkillTask / applyEditSkillTask / applyDeleteSkillTask', () => {
  it('добавление в существующий навык', () => {
    const s = makeState({ skills: [makeSkill()] })
    const s2 = applyAddSkillTask(s, 's1', {
      title: 'Новое',
      emoji: '⭐',
      xpReward: 10,
    })
    expect(s2.skillTasks).toHaveLength(1)
    expect(s2.skillTasks[0].skillId).toBe('s1')
  })

  it('добавление в несуществующий навык → ошибка', () => {
    const s = makeState()
    expect(() =>
      applyAddSkillTask(s, 'unknown', { title: 'X', emoji: '⭐', xpReward: 10 }),
    ).toThrow(FinanceError)
  })

  it('редактирование', () => {
    const s = makeState({ skills: [makeSkill()], skillTasks: [makeSkillTask()] })
    const s2 = applyEditSkillTask(s, 'st1', { xpReward: 50 })
    expect(s2.skillTasks[0].xpReward).toBe(50)
  })

  it('удаление задания', () => {
    const s = makeState({ skills: [makeSkill()], skillTasks: [makeSkillTask()] })
    const s2 = applyDeleteSkillTask(s, 'st1')
    expect(s2.skillTasks).toHaveLength(0)
  })
})
