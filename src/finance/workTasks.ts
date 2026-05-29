import type { AppState, Transaction, WorkTask } from '../types'
import { MAX_TRANSACTIONS_IN_STATE } from '../types'
import { FinanceError, validateAmount, validateLabel, type ApplyResult } from './finance'

function newId(): string {
  return crypto.randomUUID()
}

function appendTx(state: AppState, tx: Transaction): Transaction[] {
  return [tx, ...state.transactions].slice(0, MAX_TRANSACTIONS_IN_STATE)
}

/** Проверка времени "HH:mm" (или null — без времени). */
function validateTime(time: string | null): string | null {
  if (time === null) return null
  const trimmed = time.trim()
  if (!trimmed) return null
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    throw new FinanceError('INVALID_TIME', 'Время должно быть в формате ЧЧ:ММ')
  }
  return trimmed
}

export interface AddWorkTaskInput {
  title: string
  emoji: string
  amount: number
  showInMyDay: boolean
  time: string | null
}

/** Добавить рабочий таск. */
export function applyAddWorkTask(state: AppState, input: AddWorkTaskInput, now: Date): AppState {
  validateLabel(input.title)
  validateAmount(input.amount)
  const time = validateTime(input.time)
  const maxOrder = state.workTasks.reduce((m, t) => Math.max(m, t.order), -1)
  const task: WorkTask = {
    id: newId(),
    title: input.title.trim(),
    emoji: input.emoji.trim() || '💼',
    amount: input.amount,
    showInMyDay: input.showInMyDay,
    time,
    doneToday: false,
    lastEarnTxId: null,
    order: maxOrder + 1,
    createdAt: now.getTime(),
  }
  return { ...state, workTasks: [...state.workTasks, task] }
}

/**
 * Редактировать рабочий таск. Сумму меняем только на будущее — прошлый заработок
 * остаётся в балансе/журнале (как у целей/долгов).
 */
export function applyEditWorkTask(
  state: AppState,
  id: string,
  patch: Partial<Pick<WorkTask, 'title' | 'emoji' | 'amount' | 'showInMyDay' | 'time' | 'order'>>,
): AppState {
  if (!state.workTasks.some((t) => t.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Таск не найден')
  }
  if (patch.title !== undefined) validateLabel(patch.title)
  if (patch.amount !== undefined) validateAmount(patch.amount)
  const nextPatch = { ...patch }
  if (patch.time !== undefined) nextPatch.time = validateTime(patch.time)
  return {
    ...state,
    workTasks: state.workTasks.map((t) => (t.id === id ? { ...t, ...nextPatch } : t)),
  }
}

/** Удалить рабочий таск. Прошлый заработок остаётся в балансе и журнале. */
export function applyDeleteWorkTask(state: AppState, id: string): AppState {
  if (!state.workTasks.some((t) => t.id === id)) {
    throw new FinanceError('NOT_FOUND', 'Таск не найден')
  }
  return { ...state, workTasks: state.workTasks.filter((t) => t.id !== id) }
}

/**
 * Выполнить рабочий таск: начислить деньги в кошелёк (tx 'deposit', как регулярный
 * доход — попадает в «заработок» статистики). XP/серию не трогает.
 */
export function applyCompleteWorkTask(state: AppState, id: string, now: Date): ApplyResult {
  const task = state.workTasks.find((t) => t.id === id)
  if (!task) throw new FinanceError('NOT_FOUND', 'Таск не найден')
  if (task.doneToday) throw new FinanceError('ALREADY_DONE', 'Уже выполнено сегодня')
  validateAmount(task.amount)

  const tx: Transaction = {
    id: newId(),
    type: 'deposit',
    amount: task.amount,
    label: `Работа: ${task.title}`,
    timestamp: now.getTime(),
  }

  const newState: AppState = {
    ...state,
    balance: state.balance + task.amount,
    workTasks: state.workTasks.map((t) =>
      t.id === id ? { ...t, doneToday: true, lastEarnTxId: tx.id } : t,
    ),
    transactions: appendTx(state, tx),
  }

  return { state: newState, tx }
}

/**
 * Снять отметку рабочего таска: откатить заработок (баланс − amount) и убрать
 * сегодняшнюю транзакцию заработка. Возвращает id удалённой tx, чтобы стереть её и в
 * облачном журнале (как при удалении ручной операции).
 */
export function applyUncompleteWorkTask(
  state: AppState,
  id: string,
): { state: AppState; removedTxId: string | null } {
  const task = state.workTasks.find((t) => t.id === id)
  if (!task) throw new FinanceError('NOT_FOUND', 'Таск не найден')
  if (!task.doneToday) throw new FinanceError('NOT_DONE', 'Таск не был выполнен')

  const removedTxId = task.lastEarnTxId

  const newState: AppState = {
    ...state,
    balance: state.balance - task.amount,
    workTasks: state.workTasks.map((t) =>
      t.id === id ? { ...t, doneToday: false, lastEarnTxId: null } : t,
    ),
    transactions: removedTxId
      ? state.transactions.filter((t) => t.id !== removedTxId)
      : state.transactions,
  }

  return { state: newState, removedTxId }
}

/** Рабочие таски, которые показываются в «Мой день». */
export function workTasksInMyDay(state: AppState): WorkTask[] {
  return state.workTasks.filter((t) => t.showInMyDay)
}
