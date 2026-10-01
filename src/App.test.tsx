import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { useBoards } from './hooks/useBoards'
import { useSession } from './hooks/useSession'

vi.mock('./lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}))
vi.mock('./hooks/useSession')
vi.mock('./hooks/useBoards')

const mockedUseSession = vi.mocked(useSession)
const mockedUseBoards = vi.mocked(useBoards)

function sessionFor(userId: string) {
  return {
    session: { user: { id: userId, email: `${userId}@example.com` } } as never,
    loading: false,
  }
}

const BOARD_A = {
  id: 'b1',
  name: 'Board A',
  createdAt: '2026-01-01T00:00:00Z',
  columns: [{ id: 'col-1', name: 'Backlog', position: 0 }],
  cards: [],
}

describe('App - per-user session keying regression', () => {
  it('discards the previously open board when the signed-in user changes', async () => {
    const user = userEvent.setup()

    mockedUseSession.mockReturnValue(sessionFor('user-1'))
    mockedUseBoards.mockReturnValue({
      boards: [BOARD_A],
      loading: false,
      error: null,
      clearError: vi.fn(),
      createBoard: vi.fn(),
      renameBoard: vi.fn(),
      deleteBoard: vi.fn(),
      addColumn: vi.fn(),
      deleteColumn: vi.fn(),
      addCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      moveCard: vi.fn(),
    })

    const { rerender } = render(<App />)

    expect(screen.getByRole('heading', { name: 'My Boards' })).toBeInTheDocument()
    await user.click(screen.getByText('Board A'))
    expect(screen.getByRole('heading', { name: 'Board A' })).toBeInTheDocument()

    // Simulate switching Supabase accounts: a different user signs in.
    mockedUseSession.mockReturnValue(sessionFor('user-2'))
    rerender(<App />)

    expect(screen.getByRole('heading', { name: 'My Boards' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Board A' })).not.toBeInTheDocument()
  })
})
