import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpendDialog } from './SpendDialog'
import type { ExpenseCategory } from '../types'

const CATS: ExpenseCategory[] = [{ id: 'food', title: 'Еда', emoji: '🍔', order: 0 }]

function setup(onSubmit = vi.fn()) {
  render(<SpendDialog balance={1000} currency="сум" categories={CATS} onSubmit={onSubmit} />)
  return { onSubmit }
}

const amountInput = () => screen.getByPlaceholderText('0')
const labelInput = () => screen.getByPlaceholderText('Кофе')
const submitBtn = () => screen.getByRole('button', { name: 'Списать расход' })

describe('SpendDialog', () => {
  it('сабмитит сумму и название', () => {
    const { onSubmit } = setup()
    fireEvent.change(amountInput(), { target: { value: '300' } })
    fireEvent.change(labelInput(), { target: { value: 'Обед' } })
    fireEvent.click(submitBtn())
    expect(onSubmit).toHaveBeenCalledWith(300, 'Обед', undefined)
  })

  it('выбор категории подставляет её id и заполняет пустое название', () => {
    const { onSubmit } = setup()
    fireEvent.change(amountInput(), { target: { value: '300' } })
    fireEvent.click(screen.getByRole('button', { name: /Еда/ }))
    fireEvent.click(submitBtn())
    expect(onSubmit).toHaveBeenCalledWith(300, 'Еда', 'food')
  })

  it('не даёт потратить больше баланса', () => {
    const { onSubmit } = setup()
    fireEvent.change(amountInput(), { target: { value: '5000' } })
    fireEvent.change(labelInput(), { target: { value: 'Шопинг' } })
    fireEvent.click(submitBtn())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('не даёт сумму ≤ 0 (нативное ограничение min)', () => {
    const { onSubmit } = setup()
    fireEvent.change(amountInput(), { target: { value: '0' } })
    fireEvent.change(labelInput(), { target: { value: 'X' } })
    fireEvent.click(submitBtn())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('требует название', () => {
    const { onSubmit } = setup()
    fireEvent.change(amountInput(), { target: { value: '100' } })
    fireEvent.click(submitBtn())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/Введи название/)).toBeInTheDocument()
  })
})
