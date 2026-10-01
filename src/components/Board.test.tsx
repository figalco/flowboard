import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Board as BoardType, CardInput } from '../types'
import Board from './Board'

// Child components are stubbed with buttons that invoke their callback props
// directly, so these tests exercise Board's own wiring/guards without fighting
// through native drag events or nested dialog DOM.
vi.mock('./Column', () => ({
  default: (props: {
    id: string
    cards: Array<{ id: string }>
    onAdd: (columnId: string) => void
    onOpenCard: (card: unknown) => void
    onRenameTitle: (cardId: string, title: string) => void
    onDropCard: (cardId: string, columnId: string) => void
  }) => (
    <div>
      <button onClick={() => props.onAdd(props.id)}>stub-add-card</button>
      <button onClick={() => props.onOpenCard(props.cards[0])}>stub-open-card</button>
      <button onClick={() => props.onRenameTitle('card-1', 'New Title')}>stub-rename-valid</button>
      <button onClick={() => props.onRenameTitle('missing-card', 'New Title')}>stub-rename-stale</button>
      <button onClick={() => props.onDropCard('card-1', props.id)}>stub-drop</button>
    </div>
  ),
}))

vi.mock('./CardModal', () => ({
  default: (props: {
    columns: Array<{ id: string }>
    onSave: (input: CardInput) => void
    onDelete: () => void
  }) => (
    <div>
      <button
        onClick={() =>
          props.onSave({
            title: 'Saved title',
            description: '',
            assignee: '',
            priority: 'Medium',
            dueDate: '',
            columnId: props.columns[0].id,
          })
        }
      >
        stub-save
      </button>
      <button onClick={() => props.onDelete()}>stub-delete-card</button>
    </div>
  ),
}))

vi.mock('./ConfirmDialog', () => ({
  default: (props: { message: string; onConfirm: () => void }) => (
    <div>
      <span>{props.message}</span>
      <button onClick={() => props.onConfirm()}>stub-confirm</button>
    </div>
  ),
}))

const CARD = {
  id: 'card-1',
  title: 'Existing card',
  description: 'desc',
  assignee: 'Sam',
  priority: 'Medium' as const,
  dueDate: '',
  columnId: 'col-1',
}

const BOARD: BoardType = {
  id: 'board-1',
  name: 'Sprint',
  createdAt: '2026-01-01T00:00:00Z',
  columns: [{ id: 'col-1', name: 'Backlog', position: 0 }],
  cards: [CARD],
}

function renderBoard() {
  const callbacks = {
    onBack: vi.fn(),
    onAddCard: vi.fn(),
    onUpdateCard: vi.fn(),
    onDeleteCard: vi.fn(),
    onMoveCard: vi.fn(),
    onAddColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
  }
  render(<Board board={BOARD} {...callbacks} />)
  return callbacks
}

describe('Board', () => {
  it('regression: renaming a card that no longer exists on the board is a no-op', async () => {
    const user = userEvent.setup()
    const { onUpdateCard } = renderBoard()

    await user.click(screen.getByText('stub-rename-stale'))

    expect(onUpdateCard).not.toHaveBeenCalled()
  })

  it('renames an existing card by merging the new title into its current fields', async () => {
    const user = userEvent.setup()
    const { onUpdateCard } = renderBoard()

    await user.click(screen.getByText('stub-rename-valid'))

    expect(onUpdateCard).toHaveBeenCalledWith('card-1', {
      title: 'New Title',
      description: 'desc',
      assignee: 'Sam',
      priority: 'Medium',
      dueDate: '',
      columnId: 'col-1',
    })
  })

  it('wires a card drop through to onMoveCard', async () => {
    const user = userEvent.setup()
    const { onMoveCard } = renderBoard()

    await user.click(screen.getByText('stub-drop'))

    expect(onMoveCard).toHaveBeenCalledWith('card-1', 'col-1')
  })

  it('saving the "add card" modal calls onAddCard, not onUpdateCard', async () => {
    const user = userEvent.setup()
    const { onAddCard, onUpdateCard } = renderBoard()

    await user.click(screen.getByText('stub-add-card'))
    await user.click(screen.getByText('stub-save'))

    expect(onAddCard).toHaveBeenCalledWith(expect.objectContaining({ title: 'Saved title', columnId: 'col-1' }))
    expect(onUpdateCard).not.toHaveBeenCalled()
  })

  it('saving the "edit card" modal calls onUpdateCard with that card\'s id', async () => {
    const user = userEvent.setup()
    const { onUpdateCard, onAddCard } = renderBoard()

    await user.click(screen.getByText('stub-open-card'))
    await user.click(screen.getByText('stub-save'))

    expect(onUpdateCard).toHaveBeenCalledWith('card-1', expect.objectContaining({ title: 'Saved title' }))
    expect(onAddCard).not.toHaveBeenCalled()
  })

  it('confirming delete from the open card modal calls onDeleteCard', async () => {
    const user = userEvent.setup()
    const { onDeleteCard } = renderBoard()

    await user.click(screen.getByText('stub-open-card'))
    await user.click(screen.getByText('stub-delete-card'))
    expect(screen.getByText(/Delete "Existing card"/)).toBeInTheDocument()
    await user.click(screen.getByText('stub-confirm'))

    expect(onDeleteCard).toHaveBeenCalledWith('card-1')
  })
})
