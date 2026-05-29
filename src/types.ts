export type TxType = 'earn' | 'spend' | 'save' | 'withdraw'

export type Currency = 'сум' | 'USD'

export interface Task {
  id: string
  title: string
  emoji: string
  reward: number
  xpReward: number
  doneToday: boolean
}

export interface Skill {
  id: string
  title: string
  emoji: string
  xp: number
  order: number
  createdAt: number
}

export interface SkillTask {
  id: string
  skillId: string
  title: string
  emoji: string
  reward: number
  xpReward: number
  doneToday: boolean
}

export interface Goal {
  id: string
  title: string
  emoji: string
  target: number
  saved: number
  order: number
  createdAt: number
  completedAt: number | null
}

export interface Transaction {
  id: string
  type: TxType
  amount: number
  label: string
  timestamp: number
}

export interface NotifyState {
  morning: string
  evening: string
}

export interface RemindersConfig {
  enabled: boolean
  morningTime: string  // "HH:mm"
  eveningTime: string  // "HH:mm"
  eveningEnabled: boolean
  softAskDismissedAt: string | null
}

export interface AppState {
  version: number
  schemaVersion: number
  timezone: string
  dayResetHour: number
  currency: Currency
  balance: number
  totalEarned: number
  xp: number
  streak: number
  streakIncrementedToday: boolean
  lastActiveDate: string
  lastResetDate: string
  lastNotifiedDate: NotifyState
  reminders: RemindersConfig
  tasks: Task[]
  skills: Skill[]
  skillTasks: SkillTask[]
  goals: Goal[]
  transactions: Transaction[]
}

export const CURRENT_SCHEMA_VERSION = 1
export const MAX_TRANSACTIONS_IN_STATE = 200
