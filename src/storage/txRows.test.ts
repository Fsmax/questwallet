import { describe, it, expect } from 'vitest'
import type { Transaction } from '../types'
import { buildTransactionRows, isImportableTransaction } from './txRows'

const USER = 'user-1'

function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'spend',
    amount: 100,
    label: 'Кофе',
    timestamp: 1_700_000_000_000,
    ...over,
  }
}

describe('buildTransactionRows', () => {
  it('маппит валидную транзакцию в строку журнала', () => {
    const rows = buildTransactionRows(USER, [tx({ category: 'food' })])
    expect(rows).toEqual([
      {
        id: 'tx-1',
        user_id: USER,
        type: 'spend',
        amount: 100,
        label: 'Кофе',
        category: 'food',
        created_at: new Date(1_700_000_000_000).toISOString(),
      },
    ])
  })

  it('переносит оригинальную дату в created_at (не «съезжает» на сегодня)', () => {
    const ts = 1_650_000_000_000
    const [row] = buildTransactionRows(USER, [tx({ timestamp: ts })])
    expect(row.created_at).toBe(new Date(ts).toISOString())
  })

  it('подставляет category = null, если её нет', () => {
    const [row] = buildTransactionRows(USER, [tx()])
    expect(row.category).toBeNull()
  })

  it('проставляет переданный user_id', () => {
    const [row] = buildTransactionRows('другой-id', [tx()])
    expect(row.user_id).toBe('другой-id')
  })

  it('принимает все девять типов операций', () => {
    const types: Transaction['type'][] = [
      'earn', 'spend', 'save', 'withdraw', 'lend', 'collect', 'borrow', 'settle', 'deposit',
    ]
    const rows = buildTransactionRows(
      USER,
      types.map((type, i) => tx({ id: `id-${i}`, type })),
    )
    expect(rows.map((r) => r.type)).toEqual(types)
  })

  it('пустой вход → пустой массив', () => {
    expect(buildTransactionRows(USER, [])).toEqual([])
  })

  it('отбрасывает битые строки, оставляя валидные', () => {
    const input: unknown[] = [
      tx({ id: 'ok' }), // валидная
      tx({ id: '' }), // пустой id
      { ...tx(), id: undefined }, // нет id
      tx({ type: 'bogus' as Transaction['type'] }), // неизвестный тип
      tx({ amount: 0 }), // нулевая сумма
      tx({ amount: -5 }), // отрицательная сумма
      tx({ amount: Number.NaN }), // NaN
      tx({ amount: Number.POSITIVE_INFINITY }), // Infinity
      { ...tx(), label: 123 }, // label не строка
      { ...tx(), timestamp: undefined }, // нет даты
      tx({ timestamp: Number.NaN }), // битая дата
      null,
      'строка',
      42,
      undefined,
    ]
    const rows = buildTransactionRows(USER, input)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('ok')
  })
})

describe('isImportableTransaction', () => {
  it('true для валидной транзакции', () => {
    expect(isImportableTransaction(tx())).toBe(true)
  })

  it.each([
    ['null', null],
    ['строка', 'x'],
    ['число', 1],
    ['пустой объект', {}],
    ['пустой id', tx({ id: '' })],
    ['неизвестный тип', tx({ type: 'bogus' as Transaction['type'] })],
    ['нулевая сумма', tx({ amount: 0 })],
    ['NaN сумма', tx({ amount: Number.NaN })],
    ['битая дата', tx({ timestamp: Number.NaN })],
  ])('false для: %s', (_label, value) => {
    expect(isImportableTransaction(value)).toBe(false)
  })
})
