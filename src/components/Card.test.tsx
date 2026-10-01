import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Card as CardType } from '../types'
import Card from './Card'

const BASE_CARD: CardType = {
  id: 'card-1',
  title: 'Write tests',
  description: '',
  assignee: '',
  priority: 'Medium',
  dueDate: '',
  columnId: 'col-1',
}

function renderCard(overrides: Partial<CardType> = {}) {
  const onOpen = vi.fn()
  const onRenameTitle = vi.fn()
  const onDragStart = vi.fn()
  const onDragEnd = vi.fn()
  render(
    <Card
      card={{ ...BASE_CARD, ...overrides }}
      dragging={false}
      doneColumn={false}
      onOpen={onOpen}
      onRenameTitle={onRenameTitle}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />,
  )
  return { onOpen, onRenameTitle, onDragStart, onDragEnd }
}

describe('Card', () => {
  it('opens the card when the body is clicked (not the title)', async () => {
    const user = userEvent.setup()
    const { onOpen } = renderCard()

    // Clicking the title enters rename mode instead (covered below) - click the
    // surrounding card container, which is what the rest of the card body does.
    await user.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'card-1' }))
  })

  it('enters edit mode with the current title pre-filled when the title is clicked', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByText('Write tests'))
    expect(screen.getByDisplayValue('Write tests')).toBeInTheDocument()
  })

  it('regression: blurring with an empty/whitespace draft reverts and does not rename', async () => {
    const user = userEvent.setup()
    const { onRenameTitle } = renderCard()

    await user.click(screen.getByText('Write tests'))
    const input = screen.getByDisplayValue('Write tests')
    await user.clear(input)
    await user.type(input, '   ')
    fireEvent.blur(input)

    expect(onRenameTitle).not.toHaveBeenCalled()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('regression: blurring with an unchanged title does not rename', async () => {
    const user = userEvent.setup()
    const { onRenameTitle } = renderCard()

    await user.click(screen.getByText('Write tests'))
    fireEvent.blur(screen.getByDisplayValue('Write tests'))

    expect(onRenameTitle).not.toHaveBeenCalled()
  })

  it('renames when blurring with a new, trimmed title', async () => {
    const user = userEvent.setup()
    const { onRenameTitle } = renderCard()

    await user.click(screen.getByText('Write tests'))
    const input = screen.getByDisplayValue('Write tests')
    await user.clear(input)
    await user.type(input, '  Write better tests  ')
    fireEvent.blur(input)

    expect(onRenameTitle).toHaveBeenCalledWith('card-1', 'Write better tests')
  })

  it('starts a drag with the card id on the data transfer', () => {
    const { onDragStart } = renderCard()
    const cardEl = screen.getByRole('button')
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' }

    fireEvent.dragStart(cardEl, { dataTransfer })

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'card-1')
    expect(onDragStart).toHaveBeenCalledWith('card-1')
  })
})
