import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

// В CI живого Supabase нет — там URL это localhost-заглушка, пропускаем сетевые проверки.
const isCi = String(import.meta.env.VITE_SUPABASE_URL ?? '').includes('localhost')
describe.skipIf(isCi)('Supabase connection smoke test', () => {
  it('client is initialized with env vars', () => {
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
    expect(typeof supabase.auth).toBe('object')
  })

  it('can reach user_state table (RLS returns empty for anonymous)', async () => {
    const { data, error } = await supabase.from('user_state').select('user_id')

    // Без авторизации RLS вернёт пустой массив, НЕ ошибку.
    // Если получим 404 (таблица не существует) или 401/403 — что-то не так.
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    expect(data?.length).toBe(0)
  })

  it('can reach transactions table (RLS returns empty for anonymous)', async () => {
    const { data, error } = await supabase.from('transactions').select('id')

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    expect(data?.length).toBe(0)
  })
})
