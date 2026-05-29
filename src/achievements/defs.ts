export type AchievementMetric =
  | 'streak'
  | 'level'
  | 'earned'
  | 'goals'
  | 'skillLevel'
  | 'completed'
  | 'balance'

export interface AchievementDef {
  id: string
  title: string
  desc: string
  emoji: string
  metric: AchievementMetric
  target: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Квесты — общее число выполнений
  { id: 'quests_10', title: 'Трудяга', desc: '10 выполненных заданий', emoji: '✅', metric: 'completed', target: 10 },
  { id: 'quests_50', title: 'Дисциплина', desc: '50 выполненных заданий', emoji: '💪', metric: 'completed', target: 50 },
  { id: 'quests_200', title: 'Машина', desc: '200 выполненных заданий', emoji: '🤖', metric: 'completed', target: 200 },

  // Серии
  { id: 'streak_3', title: 'Разогрев', desc: 'Серия 3 дня', emoji: '🔥', metric: 'streak', target: 3 },
  { id: 'streak_7', title: 'Неделя силы', desc: 'Серия 7 дней', emoji: '🔥', metric: 'streak', target: 7 },
  { id: 'streak_30', title: 'Железная воля', desc: 'Серия 30 дней', emoji: '⚡', metric: 'streak', target: 30 },
  { id: 'streak_100', title: 'Легенда', desc: 'Серия 100 дней', emoji: '👑', metric: 'streak', target: 100 },

  // Уровень
  { id: 'level_5', title: 'Новичок+', desc: 'Достигни 5 уровня', emoji: '⭐', metric: 'level', target: 5 },
  { id: 'level_10', title: 'Опытный', desc: 'Достигни 10 уровня', emoji: '🌟', metric: 'level', target: 10 },
  { id: 'level_25', title: 'Мастер', desc: 'Достигни 25 уровня', emoji: '💫', metric: 'level', target: 25 },

  // Заработок (всего)
  { id: 'earn_10k', title: 'Первые монеты', desc: 'Заработай 10 000', emoji: '🪙', metric: 'earned', target: 10_000 },
  { id: 'earn_100k', title: 'Богатей', desc: 'Заработай 100 000', emoji: '💰', metric: 'earned', target: 100_000 },
  { id: 'earn_1m', title: 'Миллионер', desc: 'Заработай 1 000 000', emoji: '🤑', metric: 'earned', target: 1_000_000 },

  // Цели
  { id: 'goal_1', title: 'Первая цель', desc: 'Достигни первой цели', emoji: '🎯', metric: 'goals', target: 1 },
  { id: 'goal_5', title: 'Целеустремлённый', desc: 'Достигни 5 целей', emoji: '🏆', metric: 'goals', target: 5 },

  // Навыки
  { id: 'skill_5', title: 'Прокачка', desc: 'Навык до 5 уровня', emoji: '🚀', metric: 'skillLevel', target: 5 },
  { id: 'skill_10', title: 'Эксперт', desc: 'Навык до 10 уровня', emoji: '🧠', metric: 'skillLevel', target: 10 },
]
