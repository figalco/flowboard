import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { makeBuilder } from '../test/supabaseTestUtils'
import { useBoards } from './useBoards'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const from = vi.mocked(supabase.from)

const BOARD_ID = 'board-1'
const COLUMN_ID = 'col-1'

function boardRow(cards: Array<Record<string, unknown>>) {
  return {
    id: BOARD_ID,
    name: 'Launch plan',
    created_at: '2026-01-01T00:00:00Z',
    columns: [{ id: COLUMN_ID, name: 'Backlog', position: 0 }],
    cards,
  }
}

function cardRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'card-1',
    board_id: BOARD_ID,
    title: 'Write tests',
    description: '',
    assignee: '',
    priority: 'Medium',
    due_date: null,
    column_id: COLUMN_ID,
    ...overrides,
  }
}

const CARD_INPUT = {
  title: 'Write tests',
  description: '',
  assignee: '',
  priority: 'Medium' as const,
  dueDate: '',
  columnId: COLUMN_ID,
}

/** Queues the mount-time `load()` select and waits for it to settle. */
async function mountWithBoard(cards: Array<Record<string, unknown>> = []) {
  from.mockReturnValueOnce(makeBuilder({ data: [boardRow(cards)], error: null }))
  const view = renderHook(() => useBoards())
  await waitFor(() => expect(view.result.current.loading).toBe(false))
  return view
}

beforeEach(() => {
  from.mockReset()
})

describe('useBoards - addCard', () => {
  it('inserts the new card into the cards table and appends it to state', async () => {
    const { result } = await mountWithBoard([])

    from.mockReturnValueOnce(makeBuilder({ data: cardRow(), error: null }))
    await result.current.addCard(BOARD_ID, CARD_INPUT)

    const insertBuilder = from.mock.results[1].value
    expect(from).toHaveBeenNthCalledWith(2, 'cards')
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      title: 'Write tests',
      description: '',
      assignee: '',
      priority: 'Medium',
      due_date: null,
      column_id: COLUMN_ID,
      board_id: BOARD_ID,
    })

    await waitFor(() => {
      const board = result.current.boards.find((b) => b.id === BOARD_ID)
      expect(board?.cards).toHaveLength(1)
      expect(board?.cards[0]).toMatchObject({ id: 'card-1', title: 'Write tests' })
    })
  })

  it('regression: on failure, shows a friendly message and never leaks the raw backend error', async () => {
    const { result } = await mountWithBoard([])

    from.mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'permission denied for table "cards"' } }),
    )
    await result.current.addCard(BOARD_ID, CARD_INPUT)

    await waitFor(() => {
      expect(result.current.error).toBe("Couldn't add the card. Please try again.")
    })
    expect(result.current.error).not.toContain('permission denied')
    expect(result.current.boards.find((b) => b.id === BOARD_ID)?.cards).toHaveLength(0)
  })
})

describe('useBoards - updateCard', () => {
  it('updates the card row and reflects the new fields in state', async () => {
    const { result } = await mountWithBoard([cardRow()])

    from.mockReturnValueOnce(makeBuilder({ data: null, error: null }))
    const updatedInput = { ...CARD_INPUT, title: 'Write better tests' }
    await result.current.updateCard(BOARD_ID, 'card-1', updatedInput)

    const updateBuilder = from.mock.results[1].value
    expect(from).toHaveBeenNthCalledWith(2, 'cards')
    expect(updateBuilder.update).toHaveBeenCalledWith({
      title: 'Write better tests',
      description: '',
      assignee: '',
      priority: 'Medium',
      due_date: null,
      column_id: COLUMN_ID,
    })
    expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'card-1')

    await waitFor(() => {
      const card = result.current.boards.find((b) => b.id === BOARD_ID)?.cards[0]
      expect(card?.title).toBe('Write better tests')
    })
  })

  it('regression: on failure, shows a friendly message and leaves the card unchanged', async () => {
    const { result } = await mountWithBoard([cardRow()])

    from.mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'column "titlee" does not exist' } }),
    )
    await result.current.updateCard(BOARD_ID, 'card-1', { ...CARD_INPUT, title: 'Oops' })

    await waitFor(() => {
      expect(result.current.error).toBe("Couldn't save the card. Please try again.")
    })
    expect(result.current.error).not.toContain('does not exist')
    const card = result.current.boards.find((b) => b.id === BOARD_ID)?.cards[0]
    expect(card?.title).toBe('Write tests')
  })
})

describe('useBoards - moveCard', () => {
  it('updates column_id on the server and reflects the new column in state', async () => {
    const { result } = await mountWithBoard([cardRow()])

    from.mockReturnValueOnce(makeBuilder({ data: null, error: null }))
    await result.current.moveCard(BOARD_ID, 'card-1', 'col-2')

    const updateBuilder = from.mock.results[1].value
    expect(updateBuilder.update).toHaveBeenCalledWith({ column_id: 'col-2' })
    expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'card-1')

    await waitFor(() => {
      const card = result.current.boards.find((b) => b.id === BOARD_ID)?.cards[0]
      expect(card?.columnId).toBe('col-2')
    })
  })

  it('regression: on failure, rolls back the optimistic move by reloading from the server', async () => {
    const { result } = await mountWithBoard([cardRow({ column_id: COLUMN_ID })])

    // The move's own update fails...
    from.mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'relation "cards" violates row-level security policy' } }),
    )
    // ...so useBoards calls load() again, which must return the card still in its ORIGINAL column.
    from.mockReturnValueOnce(
      makeBuilder({ data: [boardRow([cardRow({ column_id: COLUMN_ID })])], error: null }),
    )

    await result.current.moveCard(BOARD_ID, 'card-1', 'col-2')

    await waitFor(() => {
      expect(result.current.error).toBe("Couldn't move the card. Please try again.")
    })
    expect(result.current.error).not.toContain('row-level security')
    await waitFor(() => {
      const card = result.current.boards.find((b) => b.id === BOARD_ID)?.cards[0]
      expect(card?.columnId).toBe(COLUMN_ID)
    })
  })
})

describe('useBoards - deleteCard', () => {
  it('removes the card from state and deletes it on the server', async () => {
    const { result } = await mountWithBoard([cardRow()])

    from.mockReturnValueOnce(makeBuilder({ data: null, error: null }))
    await result.current.deleteCard(BOARD_ID, 'card-1')

    const deleteBuilder = from.mock.results[1].value
    expect(deleteBuilder.delete).toHaveBeenCalled()
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'card-1')

    await waitFor(() => {
      expect(result.current.boards.find((b) => b.id === BOARD_ID)?.cards).toHaveLength(0)
    })
  })

  it('regression: on failure, restores the card by reloading from the server', async () => {
    const { result } = await mountWithBoard([cardRow()])

    // Delete fails...
    from.mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'permission denied for table "cards"' } }),
    )
    // ...so useBoards reloads, which must still have the card.
    from.mockReturnValueOnce(makeBuilder({ data: [boardRow([cardRow()])], error: null }))

    await result.current.deleteCard(BOARD_ID, 'card-1')

    await waitFor(() => {
      expect(result.current.error).toBe("Couldn't delete the card. Please try again.")
    })
    expect(result.current.error).not.toContain('permission denied')
    await waitFor(() => {
      expect(result.current.boards.find((b) => b.id === BOARD_ID)?.cards).toHaveLength(1)
    })
  })
})
