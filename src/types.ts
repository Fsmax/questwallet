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
  xpReward: number // баллы за выполнение (растят опыт/уровень)
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
  xpReward: number // баллы за выполнение (растят опыт/уровень и XP навыка)
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
  monthlyLimit?: number // бюджет на месяц (если задан)
}

/** Вид регулярной операции. */
export type RecurringKind = 'expense' | 'income'

/** Регулярная операция: подписки/аренда/кредит (расход) или зарплата (доход). */
export interface RecurringExpense {
  id: string
  kind: RecurringKind
  title: string
  emoji: string
  amount: number
  dayOfMonth: number // 1..28 — день месяца
  category: string | null // id категории (для расходов)
  order: number
  createdAt: number
  lastChargedMonth: string | null // "YYYY-MM" — последний месяц, за который проведено
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

/**
 * Рабочий таск: выполнение приносит деньги в кошелёк (заработок от работы).
 * XP/уровень/серию НЕ трогает. Сбрасывается каждый день (можно заработать снова).
 * Может показываться в «Мой день» (showInMyDay) общим со списком дел статусом.
 */
export interface WorkTask {
  id: string
  title: string
  emoji: string
  amount: number // сколько начисляется в кошелёк за выполнение
  showInMyDay: boolean // показывать в «Мой день» вместе с делами дня
  time: string | null // "HH:mm" для таймлайна «Мой день» либо null
  doneToday: boolean
  lastEarnTxId: string | null // id транзакции сегодняшнего заработка (нужен для отката отметки)
  order: number
  createdAt: number
}

/** Дело дня: задача на сегодня со временем и напоминанием. Баллов не даёт. */
export interface DayTask {
  id: string
  title: string
  emoji: string
  time: string | null // "HH:mm" либо null (без конкретного времени)
  reminderEnabled: boolean
  done: boolean
  lastRemindedDate: string // логический день "YYYY-MM-DD", '' = ещё не напоминали
  order: number
  createdAt: number
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
  dayTasks: DayTask[]
  workTasks: WorkTask[]
  goals: Goal[]
  transactions: Transaction[]
  expenseCategories: ExpenseCategory[]
  recurringExpenses: RecurringExpense[]
  debts: Debt[]
}

export const CURRENT_SCHEMA_VERSION = 4
export const MAX_TRANSACTIONS_IN_STATE = 200
