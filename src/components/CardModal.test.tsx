import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CardInput, Column } from '../types'
import CardModal from './CardModal'

const COLUMNS: Column[] = [
  { id: 'col-1', name: 'Backlog', position: 0 },
  { id: 'col-2', name: 'Done', position: 1 },
]

const BLANK_CARD: CardInput = {
  title: '',
  description: '',
  assignee: '',
  priority: 'Medium',
  dueDate: '',
  columnId: 'col-1',
}

function renderModal(overrides: Partial<CardInput> = {}, isEdit = false) {
  const onSave = vi.fn()
  const onDelete = vi.fn()
  const onClose = vi.fn()
  render(
    <CardModal
      initial={{ ...BLANK_CARD, ...overrides }}
      isEdit={isEdit}
      columns={COLUMNS}
      onSave={onSave}
      onDelete={onDelete}
      onClose={onClose}
    />,
  )
  return { onSave, onDelete, onClose }
}

describe('CardModal', () => {
  it('renders fields pre-filled from the initial card', () => {
    renderModal({ title: 'Ship it', assignee: 'Alex' }, true)
    expect(screen.getByDisplayValue('Ship it')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alex')).toBeInTheDocument()
  })

  it('submits trimmed title and assignee', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByPlaceholderText('Enter card name...'), '  New card  ')
    await user.type(screen.getByPlaceholderText('Who is responsible?'), '  Sam  ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'New card', assignee: 'Sam' }))
  })

  it('regression: does not save when the title is empty or whitespace-only', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal({ title: '' })

    await user.type(screen.getByPlaceholderText('Enter card name...'), '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows "Delete card" only when editing, and calls onDelete when clicked', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderModal({ title: 'Existing card' }, true)

    const deleteButton = screen.getByRole('button', { name: 'Delete card' })
    await user.click(deleteButton)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('does not render "Delete card" when creating a new card', () => {
    renderModal({}, false)
    expect(screen.queryByRole('button', { name: 'Delete card' })).not.toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal({ title: 'Existing card' }, true)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
