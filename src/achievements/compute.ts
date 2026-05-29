import type { AppState } from '../types'
import { calcLevel } from '../finance/game'
import { ACHIEVEMENTS, type AchievementDef, type AchievementMetric } from './defs'

export interface AchievementView {
  def: AchievementDef
  value: number
  unlocked: boolean
  conditionMet: boolean
  progress: number
}

export function getMetricValue(state: AppState, metric: AchievementMetric): number {
  switch (metric) {
    case 'streak':
      return state.streak
    case 'level':
      return calcLevel(state.xp).level
    case 'earned':
      return state.totalEarned
    case 'goals':
      return state.goals.filter((g) => g.completedAt !== null).length
    case 'skillLevel':
      return state.skills.reduce((max, s) => Math.max(max, calcLevel(s.xp).level), 1)
    case 'completed':
      return state.totalCompleted
    case 'balance':
      return state.balance
  }
}

export function computeAchievements(state: AppState): AchievementView[] {
  const unlocked = new Set(state.unlockedAchievements)
  return ACHIEVEMENTS.map((def) => {
    const value = getMetricValue(state, def.metric)
    const conditionMet = value >= def.target
    return {
      def,
      value,
      unlocked: unlocked.has(def.id),
      conditionMet,
      progress: Math.min(1, value / def.target),
    }
  })
}

/**
 * Возвращает id достижений, которые ТОЛЬКО ЧТО выполнились
 * (условие выполнено, но ещё не в unlockedAchievements).
 */
export function newlyUnlocked(state: AppState): string[] {
  const unlocked = new Set(state.unlockedAchievements)
  return ACHIEVEMENTS.filter((def) => {
    if (unlocked.has(def.id)) return false
    return getMetricValue(state, def.metric) >= def.target
  }).map((def) => def.id)
}
