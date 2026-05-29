import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DebtForm } from './DebtForm'
import type { Debt } from '../types'

const personInput = () => screen.getByPlaceholderText('Имя')
const principalInput = () => screen.getByPlaceholderText('0')

describe('DebtForm (новый)', () => {
  it('по умолчанию «мне должны» и сабмитит значения', () => {
    const onSubmit = vi.fn()
    render(<DebtForm onSubmit={onSubmit} />)
    fireEvent.change(personInput(), { target: { value: 'Алишер' } })
    fireEvent.change(principalInput(), { target: { value: '1000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить долг' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'owed_to_me', person: 'Алишер', principal: 1000 }),
    )
  })

  it('переключение на «я должен»', () => {
    const onSubmit = vi.fn()
    render(<DebtForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Я должен/ }))
    fireEvent.change(personInput(), { target: { value: 'Банк' } })
    fireEvent.change(principalInput(), { target: { value: '2000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить долг' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ direction: 'i_owe' }))
  })

  it('требует имя', () => {
    const onSubmit = vi.fn()
    render(<DebtForm onSubmit={onSubmit} />)
    fireEvent.change(principalInput(), { target: { value: '1000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить долг' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/Введи имя/)).toBeInTheDocument()
  })
})

describe('DebtForm (редактирование)', () => {
  const debt: Debt = {
    id: 'd1',
    direction: 'owed_to_me',
    person: 'Алишер',
    emoji: '🤝',
    principal: 1000,
    paid: 0,
    note: '',
    dueDate: null,
    order: 0,
    createdAt: 0,
    settledAt: null,
  }

  it('не показывает переключатель типа и сохраняет', () => {
    const onSubmit = vi.fn()
    render(<DebtForm initial={debt} onSubmit={onSubmit} onDelete={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Мне должны/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ person: 'Алишер', principal: 1000 }))
  })
})
