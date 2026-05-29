export type TxType =
  | 'earn'
  | 'spend'
  | 'save'
  | 'withdraw'
  | 'lend' // дал в долг (баланс −)
  | 'collect' // мне вернули долг (баланс +)
  | 'borrow' // взял в долг (баланс +)
  | 'settle' // отдал свой долг (баланс −)
  | 'deposit' // пополнение кошелька своими деньгами (баланс +)

export type Currency = 'сум' | 'USD'

/** Направление долга: кто кому должен. */
export type DebtDirection = 'owed_to_me' | 'i_owe'

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
  category?: string // id категории расхода (только для type === 'spend')
}

/** Категория расходов (Еда, Транспорт…). */
export interface ExpenseCategory {
  id: string
  title: string
  emoji: string
  order: number
}

/** Регулярный (повторяющийся) расход: подписки, аренда, кредит. */
export interface RecurringExpense {
  id: string
  title: string
  emoji: string
  amount: number
  dayOfMonth: number // 1..28 — день месяца списания
  category: string | null // id категории
  order: number
  createdAt: number
  lastChargedMonth: string | null // "YYYY-MM" — последний месяц, за который списано
}

/** Долг: либо мне должны (owed_to_me), либо должен я (i_owe). */
export interface Debt {
  id: string
  direction: DebtDirection
  person: string // имя контрагента
  emoji: string
  principal: number // изначальная сумма долга
  paid: number // сколько уже погашено (возвращено мне / отдано мной)
  note: string
  dueDate: string | null // "YYYY-MM-DD" или null
  order: number
  createdAt: number
  settledAt: number | null // когда долг закрыт полностью
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
  totalCompleted: number
  streak: number
  streakIncrementedToday: boolean
  unlockedAchievements: string[]
  lastActiveDate: string
  lastResetDate: string
  lastNotifiedDate: NotifyState
  reminders: RemindersConfig
  tasks: Task[]
  skills: Skill[]
  skillTasks: SkillTask[]
  goals: Goal[]
  transactions: Transaction[]
  expenseCategories: ExpenseCategory[]
  recurringExpenses: RecurringExpense[]
  debts: Debt[]
}

export const CURRENT_SCHEMA_VERSION = 2
export const MAX_TRANSACTIONS_IN_STATE = 200
