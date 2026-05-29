import type { AppState, Transaction, TxType, Goal, Task, Skill, SkillTask } from '../types'
import { MAX_TRANSACTIONS_IN_STATE } from '../types'
import { tickStreak } from './game'

const MAX_AMOUNT = 1_000_000_000
const MAX_LABEL_LEN = 80

export class FinanceError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'FinanceError'
  }
}

export function validateAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FinanceError('INVALID_AMOUNT', 'Сумма должна быть больше нуля')
  }
  if (amount > MAX_AMOUNT) {
    throw new FinanceError('AMOUNT_TOO_BIG', 'Сумма слишком большая')
  }
}

export function validateLabel(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) throw new FinanceError('EMPTY_LABEL', 'Название не может быть пустым')
  if (trimmed.length > MAX_LABEL_LEN) {
    throw new FinanceError('LABEL_TOO_LONG', `Название не должно превышать ${MAX_LABEL_LEN} символов`)
  }
  return trimmed
}

function newTxId(): string {
  return crypto.randomUUID()
}

function appendTx(state: AppState, tx: Transaction): Transaction[] {
  const next = [tx, ...state.transactions]
  return next.slice(0, MAX_TRANSACTIONS_IN_STATE)
}

export interface ApplyResult {
  state: AppState
  tx: Transaction
}

/**
 * Выполнить задание: начислить деньги и XP, обновить streak.
 */
export function applyEarn(state: AppState, taskId: string, now: Date): ApplyResult {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) throw new FinanceError('NOT_FOUND', 'Задание не найдено')
  if (task.doneToday) throw new FinanceError('ALREADY_DONE', 'Задание уже выполнено сегодня')
  validateAmount(task.reward)

  const streakUpdate = tickStreak(state, now)

  const tx: Transaction = {
    id: newTxId(),
    type: 'earn',
    amount: task.reward,
    label: `Награда: ${task.title}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance + task.reward,
    totalEarned: state.totalEarned + task.reward,
    xp: state.xp + task.xpReward,
    totalCompleted: state.totalCompleted + 1,
    streak: streakUpdate.streak,
    lastActiveDate: streakUpdate.lastActiveDate,
    streakIncrementedToday: streakUpdate.incremented || state.streakIncrementedToday,
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, doneToday: true } : t)),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Отменить выполнение задания: откатить деньги, XP, и (если это единственное за день) streak.
 */
export function applyCancel(state: AppState, taskId: string): { state: AppState } {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) throw new FinanceError('NOT_FOUND', 'Задание не найдено')
  if (!task.doneToday) throw new FinanceError('NOT_DONE', 'Задание не было выполнено')

  // Откат streak: только если это было единственное выполненное за сегодня
  const otherDoneToday = state.tasks.some((t) => t.id !== taskId && t.doneToday)
  const shouldRollbackStreak = state.streakIncrementedToday && !otherDoneToday

  let streak = state.streak
  let lastActiveDate = state.lastActiveDate
  let streakIncrementedToday = state.streakIncrementedToday
  if (shouldRollbackStreak) {
    streak = Math.max(0, state.streak - 1)
    // lastActiveDate откатываем к пустой строке: пользователь сегодня ничего не сделал
    lastActiveDate = ''
    streakIncrementedToday = false
  }

  const newState: AppState = {
    ...state,
    balance: state.balance - task.reward,
    totalEarned: state.totalEarned - task.reward,
    xp: Math.max(0, state.xp - task.xpReward),
    streak,
    lastActiveDate,
    streakIncrementedToday,
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, doneToday: false } : t)),
  }

  return { state: newState }
}

/**
 * Отложить на цель: balance → goal.saved. Нельзя в минус.
 */
export function applySave(
  state: AppState,
  goalId: string,
  amount: number,
  now: Date,
): ApplyResult {
  validateAmount(amount)
  if (amount > state.balance) {
    throw new FinanceError('INSUFFICIENT_BALANCE', 'Недостаточно денег в кошельке')
  }
  const goal = state.goals.find((g) => g.id === goalId)
  if (!goal) throw new FinanceError('NOT_FOUND', 'Цель не найдена')

  const newSaved = goal.saved + amount
  const completedAt = newSaved >= goal.target && !goal.completedAt ? now.getTime() : goal.completedAt

  const tx: Transaction = {
    id: newTxId(),
    type: 'save',
    amount,
    label: `На цель: ${goal.title}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance - amount,
    goals: state.goals.map((g) =>
      g.id === goalId ? { ...g, saved: newSaved, completedAt } : g,
    ),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Снять с цели обратно в кошелёк.
 */
export function applyWithdraw(
  state: AppState,
  goalId: string,
  amount: number,
  now: Date,
): ApplyResult {
  validateAmount(amount)
  const goal = state.goals.find((g) => g.id === goalId)
  if (!goal) throw new FinanceError('NOT_FOUND', 'Цель не найдена')
  if (amount > goal.saved) {
    throw new FinanceError('INSUFFICIENT_GOAL', 'На цели недостаточно денег')
  }

  const newSaved = goal.saved - amount
  // Если цель была выполнена, а теперь нет — сбросить completedAt
  const completedAt = goal.completedAt && newSaved < goal.target ? null : goal.completedAt

  const tx: Transaction = {
    id: newTxId(),
    type: 'withdraw',
    amount,
    label: `С цели: ${goal.title}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance + amount,
    goals: state.goals.map((g) =>
      g.id === goalId ? { ...g, saved: newSaved, completedAt } : g,
    ),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Записать расход. Нельзя потратить больше, чем в кошельке.
 */
export function applySpend(
  state: AppState,
  amount: number,
  label: string,
  now: Date,
  category?: string,
): ApplyResult {
  validateAmount(amount)
  if (amount > state.balance) {
    throw new FinanceError('INSUFFICIENT_BALANCE', 'Недостаточно денег в кошельке')
  }
  const trimmedLabel = validateLabel(label)
  // Категорию принимаем только если она реально существует в state.
  const validCategory =
    category && state.expenseCategories.some((c) => c.id === category) ? category : undefined

  const tx: Transaction = {
    id: newTxId(),
    type: 'spend',
    amount,
    label: trimmedLabel,
    timestamp: now.getTime(),
    ...(validCategory ? { category: validCategory } : {}),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance - amount,
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

// ============= Жизненный цикл сущностей =============

export type DeleteGoalMode = 'return_to_wallet' | 'discard'

/**
 * Удалить цель. Если saved > 0, нужен mode: куда деть деньги.
 */
export function applyDeleteGoal(
  state: AppState,
  goalId: string,
  mode: DeleteGoalMode,
  now: Date,
): { state: AppState; tx: Transaction | null } {
  const goal = state.goals.find((g) => g.id === goalId)
  if (!goal) throw new FinanceError('NOT_FOUND', 'Цель не найдена')

  const goalsWithoutThis = state.goals.filter((g) => g.id !== goalId)

  if (goal.saved === 0) {
    return { state: { ...state, goals: goalsWithoutThis }, tx: null }
  }

  if (mode === 'return_to_wallet') {
    const tx: Transaction = {
      id: newTxId(),
      type: 'withdraw',
      amount: goal.saved,
      label: `Возврат с удалённой цели: ${goal.title}`,
      timestamp: now.getTime(),
    }
    return {
      state: {
        ...state,
        balance: state.balance + goal.saved,
        goals: goalsWithoutThis,
        transactions: appendTx(state, tx),
      },
      tx,
    }
  }

  // discard
  const tx: Transaction = {
    id: newTxId(),
    type: 'spend',
    amount: goal.saved,
    label: `Списание удалённой цели: ${goal.title}`,
    timestamp: now.getTime(),
  }
  return {
    state: {
      ...state,
      goals: goalsWithoutThis,
      transactions: appendTx(state, tx),
    },
    tx,
  }
}

/**
 * Удалить задание. Деньги/XP за прошлые выполнения остаются в балансе.
 */
export function applyDeleteTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.filter((t) => t.id !== taskId),
  }
}

/**
 * Редактировать цель: title/emoji/target.
 * Если новый target <= saved → автозавершение без конфетти.
 * Если new target > saved и цель была завершена → снова активна.
 */
export function applyEditGoal(
  state: AppState,
  goalId: string,
  patch: Partial<Pick<Goal, 'title' | 'emoji' | 'target' | 'order'>>,
  now: Date,
): AppState {
  const goal = state.goals.find((g) => g.id === goalId)
  if (!goal) throw new FinanceError('NOT_FOUND', 'Цель не найдена')

  if (patch.target !== undefined) {
    validateAmount(patch.target)
  }
  if (patch.title !== undefined) {
    validateLabel(patch.title)
  }

  const newTarget = patch.target ?? goal.target
  let completedAt = goal.completedAt
  if (newTarget <= goal.saved && !goal.completedAt) {
    completedAt = now.getTime()
  } else if (newTarget > goal.saved && goal.completedAt) {
    completedAt = null
  }

  return {
    ...state,
    goals: state.goals.map((g) =>
      g.id === goalId ? { ...g, ...patch, completedAt } : g,
    ),
  }
}

/**
 * Редактировать задание (только будущие выполнения).
 */
export function applyEditTask(
  state: AppState,
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'emoji' | 'reward' | 'xpReward'>>,
): AppState {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) throw new FinanceError('NOT_FOUND', 'Задание не найдено')

  if (patch.reward !== undefined) validateAmount(patch.reward)
  if (patch.title !== undefined) validateLabel(patch.title)

  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
  }
}

/**
 * Добавить новое задание.
 */
export function applyAddTask(
  state: AppState,
  task: Omit<Task, 'id' | 'doneToday'>,
): AppState {
  validateLabel(task.title)
  validateAmount(task.reward)
  return {
    ...state,
    tasks: [
      ...state.tasks,
      { ...task, id: crypto.randomUUID(), doneToday: false },
    ],
  }
}

/**
 * Добавить новую цель.
 */
export function applyAddGoal(
  state: AppState,
  goal: Omit<Goal, 'id' | 'saved' | 'createdAt' | 'completedAt' | 'order'>,
  now: Date,
): AppState {
  validateLabel(goal.title)
  validateAmount(goal.target)
  const maxOrder = state.goals.reduce((m, g) => Math.max(m, g.order), -1)
  return {
    ...state,
    goals: [
      ...state.goals,
      {
        ...goal,
        id: crypto.randomUUID(),
        saved: 0,
        order: maxOrder + 1,
        createdAt: now.getTime(),
        completedAt: null,
      },
    ],
  }
}

/**
 * Используется в Кошельке для типа транзакции — на случай UI-сортировок.
 */
export const TX_TYPES: readonly TxType[] = ['earn', 'spend', 'save', 'withdraw'] as const

// ============= Навыки =============

/**
 * Выполнить задание навыка: деньги, общий XP и XP в навык.
 */
export function applyEarnSkillTask(state: AppState, taskId: string, now: Date): ApplyResult {
  const task = state.skillTasks.find((t) => t.id === taskId)
  if (!task) throw new FinanceError('NOT_FOUND', 'Задание не найдено')
  if (task.doneToday) throw new FinanceError('ALREADY_DONE', 'Задание уже выполнено сегодня')
  const skill = state.skills.find((s) => s.id === task.skillId)
  if (!skill) throw new FinanceError('NOT_FOUND', 'Навык не найден')
  validateAmount(task.reward)

  const streakUpdate = tickStreak(state, now)

  const tx: Transaction = {
    id: newTxId(),
    type: 'earn',
    amount: task.reward,
    label: `${skill.title}: ${task.title}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance + task.reward,
    totalEarned: state.totalEarned + task.reward,
    xp: state.xp + task.xpReward,
    totalCompleted: state.totalCompleted + 1,
    streak: streakUpdate.streak,
    lastActiveDate: streakUpdate.lastActiveDate,
    streakIncrementedToday: streakUpdate.incremented || state.streakIncrementedToday,
    skillTasks: state.skillTasks.map((t) => (t.id === taskId ? { ...t, doneToday: true } : t)),
    skills: state.skills.map((s) =>
      s.id === task.skillId ? { ...s, xp: s.xp + task.xpReward } : s,
    ),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Отмена задания навыка: откатить деньги, общий XP, XP навыка, streak (по правилам).
 */
export function applyCancelSkillTask(state: AppState, taskId: string): { state: AppState } {
  const task = state.skillTasks.find((t) => t.id === taskId)
  if (!task) throw new FinanceError('NOT_FOUND', 'Задание не найдено')
  if (!task.doneToday) throw new FinanceError('NOT_DONE', 'Задание не было выполнено')

  const otherTaskDone = state.tasks.some((t) => t.doneToday)
  const otherSkillTaskDone = state.skillTasks.some((t) => t.id !== taskId && t.doneToday)
  const shouldRollbackStreak =
    state.streakIncrementedToday && !otherTaskDone && !otherSkillTaskDone

  let streak = state.streak
  let lastActiveDate = state.lastActiveDate
  let streakIncrementedToday = state.streakIncrementedToday
  if (shouldRollbackStreak) {
    streak = Math.max(0, state.streak - 1)
    lastActiveDate = ''
    streakIncrementedToday = false
  }

  const newState: AppState = {
    ...state,
    balance: state.balance - task.reward,
    totalEarned: state.totalEarned - task.reward,
    xp: Math.max(0, state.xp - task.xpReward),
    streak,
    lastActiveDate,
    streakIncrementedToday,
    skillTasks: state.skillTasks.map((t) => (t.id === taskId ? { ...t, doneToday: false } : t)),
    skills: state.skills.map((s) =>
      s.id === task.skillId ? { ...s, xp: Math.max(0, s.xp - task.xpReward) } : s,
    ),
  }

  return { state: newState }
}

export function applyAddSkill(
  state: AppState,
  input: { title: string; emoji: string },
  now: Date,
): AppState {
  validateLabel(input.title)
  const maxOrder = state.skills.reduce((m, s) => Math.max(m, s.order), -1)
  return {
    ...state,
    skills: [
      ...state.skills,
      {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        emoji: input.emoji.trim() || '🎓',
        xp: 0,
        order: maxOrder + 1,
        createdAt: now.getTime(),
      },
    ],
  }
}

export function applyEditSkill(
  state: AppState,
  skillId: string,
  patch: Partial<Pick<Skill, 'title' | 'emoji' | 'order'>>,
): AppState {
  if (!state.skills.some((s) => s.id === skillId)) {
    throw new FinanceError('NOT_FOUND', 'Навык не найден')
  }
  if (patch.title !== undefined) validateLabel(patch.title)
  return {
    ...state,
    skills: state.skills.map((s) => (s.id === skillId ? { ...s, ...patch } : s)),
  }
}

/**
 * Удаление навыка: удаляет сам навык И все его задания. Заработанные деньги/XP остаются.
 */
export function applyDeleteSkill(state: AppState, skillId: string): AppState {
  if (!state.skills.some((s) => s.id === skillId)) {
    throw new FinanceError('NOT_FOUND', 'Навык не найден')
  }
  return {
    ...state,
    skills: state.skills.filter((s) => s.id !== skillId),
    skillTasks: state.skillTasks.filter((t) => t.skillId !== skillId),
  }
}

export function applyAddSkillTask(
  state: AppState,
  skillId: string,
  input: Omit<SkillTask, 'id' | 'skillId' | 'doneToday'>,
): AppState {
  if (!state.skills.some((s) => s.id === skillId)) {
    throw new FinanceError('NOT_FOUND', 'Навык не найден')
  }
  validateLabel(input.title)
  validateAmount(input.reward)
  return {
    ...state,
    skillTasks: [
      ...state.skillTasks,
      { ...input, id: crypto.randomUUID(), skillId, doneToday: false },
    ],
  }
}

export function applyEditSkillTask(
  state: AppState,
  taskId: string,
  patch: Partial<Pick<SkillTask, 'title' | 'emoji' | 'reward' | 'xpReward'>>,
): AppState {
  if (!state.skillTasks.some((t) => t.id === taskId)) {
    throw new FinanceError('NOT_FOUND', 'Задание не найдено')
  }
  if (patch.title !== undefined) validateLabel(patch.title)
  if (patch.reward !== undefined) validateAmount(patch.reward)
  return {
    ...state,
    skillTasks: state.skillTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
  }
}

export function applyDeleteSkillTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    skillTasks: state.skillTasks.filter((t) => t.id !== taskId),
  }
}
