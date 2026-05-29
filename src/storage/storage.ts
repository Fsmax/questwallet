import { supabase } from '../lib/supabase'
import type { AppState, Transaction } from '../types'
import { createInitialState } from '../lib/seed'
import { ensureDefaults } from './ensureDefaults'

const LS_KEY_PREFIX = 'questwallet_state_'
const LS_VERSION_KEY_PREFIX = 'questwallet_state_version_'
const DEBOUNCE_MS = 700

function lsKey(userId: string) {
  return `${LS_KEY_PREFIX}${userId}`
}
function lsVersionKey(userId: string) {
  return `${LS_VERSION_KEY_PREFIX}${userId}`
}

export interface LoadResult {
  state: AppState
  version: number
  source: 'cloud' | 'cache' | 'seed'
}

export class ConflictError extends Error {
  serverVersion: number
  constructor(serverVersion: number) {
    super('State version conflict: server has newer data')
    this.serverVersion = serverVersion
    this.name = 'ConflictError'
  }
}

/**
 * Загрузить state: сначала localStorage (мгновенно), затем фоном обновить из облака.
 * Возвращает то что есть прямо сейчас + источник.
 * Если в облаке ничего нет (новый пользователь) — создаёт seed и сохраняет.
 */
export async function loadState(userId: string): Promise<LoadResult> {
  // 1. Облако
  const { data, error } = await supabase
    .from('user_state')
    .select('state, state_version')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    // Сеть не работает — пытаемся кэш
    const cached = readCache(userId)
    if (cached) {
      return { state: cached.state, version: cached.version, source: 'cache' }
    }
    throw error
  }

  if (data) {
    const state = ensureDefaults(data.state as AppState)
    const version = Number(data.state_version)
    writeCache(userId, state, version)
    return { state, version, source: 'cloud' }
  }

  // Нет записи — новый пользователь, создаём seed
  const seed = createInitialState()
  const { data: inserted, error: insertErr } = await supabase
    .from('user_state')
    .insert({ user_id: userId, state: seed, state_version: 1 })
    .select('state_version')
    .single()

  if (insertErr) throw insertErr
  const version = Number(inserted.state_version)
  writeCache(userId, seed, version)
  return { state: seed, version, source: 'seed' }
}

/**
 * Сохранить state с optimistic locking.
 * Если на сервере версия выше expectedVersion — ConflictError со свежей версией сервера.
 */
export async function saveStateImmediate(
  userId: string,
  state: AppState,
  expectedVersion: number,
): Promise<{ newVersion: number }> {
  const newVersion = expectedVersion + 1

  const { data, error } = await supabase
    .from('user_state')
    .update({ state, state_version: newVersion })
    .eq('user_id', userId)
    .eq('state_version', expectedVersion)
    .select('state_version')

  if (error) throw error

  if (!data || data.length === 0) {
    // 0 rows affected → version mismatch
    const fresh = await supabase
      .from('user_state')
      .select('state_version')
      .eq('user_id', userId)
      .single()
    throw new ConflictError(Number(fresh.data?.state_version ?? 0))
  }

  writeCache(userId, state, newVersion)
  return { newVersion: Number(data[0].state_version) }
}

/**
 * Debounced save: вызывается часто на каждое изменение, шлёт в облако с задержкой.
 * Возвращает функцию для немедленной отправки (flush) и отмены (cancel).
 */
export function createDebouncedSaver(
  userId: string,
  getExpectedVersion: () => number,
  onVersionUpdate: (v: number) => void,
  onConflict: (serverVersion: number) => void,
  onError: (err: unknown) => void,
) {
  let pending: AppState | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false

  const flush = async () => {
    if (!pending || inFlight) return
    const toSend = pending
    pending = null
    inFlight = true
    try {
      const { newVersion } = await saveStateImmediate(userId, toSend, getExpectedVersion())
      onVersionUpdate(newVersion)
    } catch (e) {
      if (e instanceof ConflictError) {
        onConflict(e.serverVersion)
      } else {
        onError(e)
      }
    } finally {
      inFlight = false
      if (pending) {
        scheduleFlush()
      }
    }
  }

  const scheduleFlush = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void flush()
    }, DEBOUNCE_MS)
  }

  return {
    save(state: AppState) {
      pending = state
      writeCache(userId, state, getExpectedVersion())
      scheduleFlush()
    },
    flush: async () => {
      if (timer) clearTimeout(timer)
      timer = null
      await flush()
    },
    cancel() {
      if (timer) clearTimeout(timer)
      timer = null
      pending = null
    },
  }
}

/**
 * Записать транзакцию в БД с идемпотентностью.
 * Повторная вставка с тем же id (23505) — это успех, а не ошибка.
 */
export async function appendTransaction(
  userId: string,
  tx: Transaction,
): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    id: tx.id,
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    label: tx.label,
    category: tx.category ?? null,
  })

  if (error && error.code !== '23505') {
    throw error
  }
}

/**
 * Загрузить полную историю транзакций (для UI "показать больше").
 */
export async function loadTransactions(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, amount, label, category, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.type as Transaction['type'],
    amount: Number(row.amount),
    label: row.label as string,
    timestamp: new Date(row.created_at as string).getTime(),
    ...(row.category ? { category: row.category as string } : {}),
  }))
}

/**
 * Полный сброс: перезаписать state на свежий seed и обнулить версию в облаке.
 */
export async function resetState(userId: string): Promise<LoadResult> {
  const fresh = createInitialState()

  // Чистим журнал транзакций, иначе «Статистика» (читает из БД) покажет старую
  // историю при обнулённом балансе.
  const { error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
  if (txError) throw txError

  const { data, error } = await supabase
    .from('user_state')
    .update({ state: fresh, state_version: 1 })
    .eq('user_id', userId)
    .select('state_version')
    .single()

  if (error) throw error
  const version = Number(data.state_version)
  writeCache(userId, fresh, version)
  return { state: fresh, version, source: 'seed' }
}

// ============= localStorage cache =============

function readCache(userId: string): { state: AppState; version: number } | null {
  try {
    const raw = localStorage.getItem(lsKey(userId))
    const versionRaw = localStorage.getItem(lsVersionKey(userId))
    if (!raw || !versionRaw) return null
    return {
      state: ensureDefaults(JSON.parse(raw) as AppState),
      version: Number(versionRaw),
    }
  } catch {
    return null
  }
}

function writeCache(userId: string, state: AppState, version: number): void {
  try {
    localStorage.setItem(lsKey(userId), JSON.stringify(state))
    localStorage.setItem(lsVersionKey(userId), String(version))
  } catch {
    // localStorage может быть недоступен (private mode, переполнение) — игнорируем
  }
}

export function clearCache(userId: string): void {
  try {
    localStorage.removeItem(lsKey(userId))
    localStorage.removeItem(lsVersionKey(userId))
  } catch {
    /* ignore */
  }
}
